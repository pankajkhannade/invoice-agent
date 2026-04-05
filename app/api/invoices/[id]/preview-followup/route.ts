import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFollowUpTemplate } from "@/lib/followup";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId },
    include: { user: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return NextResponse.json({ error: "Cannot send follow-up for paid or cancelled invoice" }, { status: 400 });
  }

  if (invoice.followUpStep >= 3) {
    return NextResponse.json({ error: "All follow-up steps already sent" }, { status: 400 });
  }

  const nextStep = invoice.followUpStep + 1;
  const { subject, body } = getFollowUpTemplate(nextStep, invoice);

  return NextResponse.json({
    step: nextStep,
    subject,
    body,
    recipient: invoice.clientEmail,
    clientName: invoice.clientName,
    invoiceNumber: invoice.id.slice(-6).toUpperCase(),
  });
}
