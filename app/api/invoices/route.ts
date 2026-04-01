import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: { followUps: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user?.plan === "free") {
    // Allow 1 free invoice; block after that
    const existingCount = await prisma.invoice.count({ where: { userId } });
    if (existingCount >= 1) {
      return NextResponse.json(
        { error: "Free plan includes 1 invoice. Upgrade to add more." },
        { status: 403 }
      );
    }
  }

  const { clientName, clientEmail, amount, currency, dueDate, notes } = await req.json();

  if (!clientName || !clientEmail || !amount || !dueDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientName,
      clientEmail,
      amount: parseFloat(amount),
      currency: currency || "USD",
      dueDate: new Date(dueDate),
      notes,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
