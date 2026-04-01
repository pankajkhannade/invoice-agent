import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFollowUp } from "@/lib/followup";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const invoice = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.followUpStep >= 3) {
    return NextResponse.json({ error: "All follow-up steps already sent" }, { status: 400 });
  }

  const result = await sendFollowUp(params.id);
  return NextResponse.json({ ok: true, ...result });
}
