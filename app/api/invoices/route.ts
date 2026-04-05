import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;

  // Auto-detect overdue invoices: any "pending" invoice past its dueDate becomes "overdue"
  const now = new Date();
  await prisma.invoice.updateMany({
    where: {
      userId,
      status: "pending",
      dueDate: { lt: now },
    },
    data: { status: "overdue" },
  });

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
        { error: "Free plan includes 1 invoice. Upgrade to add more.", upgrade: true },
        { status: 403 }
      );
    }
  } else if (user?.plan === "starter") {
    // Enforce 20 active invoice cap for Starter plan
    const existingCount = await prisma.invoice.count({
      where: { userId, status: { notIn: ["cancelled", "paid"] } },
    });
    if (existingCount >= 20) {
      return NextResponse.json(
        { error: "Starter plan is limited to 20 active invoices. Upgrade to Growth for unlimited.", upgrade: true },
        { status: 403 }
      );
    }
  }
  // Growth plan: no invoice limit

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
