import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const { invoices } = await req.json();
  if (!Array.isArray(invoices)) {
    return NextResponse.json({ error: "invoices must be an array" }, { status: 400 });
  }

  let created = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < invoices.length; i++) {
    const row = invoices[i];
    try {
      if (!row.clientName || !row.clientEmail || !row.amount || !row.dueDate) {
        errors.push({ index: i, error: "Missing required fields (clientName, clientEmail, amount, dueDate)" });
        continue;
      }
      await prisma.invoice.create({
        data: {
          userId,
          clientName: row.clientName,
          clientEmail: row.clientEmail,
          amount: parseFloat(row.amount),
          currency: row.currency || "USD",
          dueDate: new Date(row.dueDate),
          notes: row.notes || null,
        },
      });
      created++;
    } catch (_err) {
      errors.push({ index: i, error: "Failed to create invoice" });
    }
  }

  return NextResponse.json({ created, failed: invoices.length - created, errors });
}
