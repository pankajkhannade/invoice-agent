import { NextResponse } from "next/server";
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
  });

  // ── Overall stats ──────────────────────────────────────────────────────────
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalCollected = paidInvoices.reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices
    .filter(i => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + i.amount, 0);

  const collectionRate = totalInvoices > 0
    ? Math.round((paidInvoices.length / totalInvoices) * 100)
    : 0;

  // ── Per-client breakdown ────────────────────────────────────────────────────
  const clientMap = new Map<string, {
    clientName: string;
    clientEmail: string;
    totalInvoices: number;
    paidInvoices: number;
    totalAmount: number;
    collectedAmount: number;
    outstandingAmount: number;
    avgDaysToPayment: number | null;
    followUpEffectiveness: number; // % of paid invoices that received at least 1 follow-up
  }>();

  for (const inv of invoices) {
    if (!clientMap.has(inv.clientEmail)) {
      clientMap.set(inv.clientEmail, {
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        totalInvoices: 0,
        paidInvoices: 0,
        totalAmount: 0,
        collectedAmount: 0,
        outstandingAmount: 0,
        avgDaysToPayment: null,
        followUpEffectiveness: 0,
      });
    }
    const c = clientMap.get(inv.clientEmail)!;
    c.totalInvoices += 1;
    c.totalAmount += inv.amount;

    if (inv.status === "paid") {
      c.paidInvoices += 1;
      c.collectedAmount += inv.amount;
      if (inv.paidAt && inv.createdAt) {
        const days = Math.round(
          (new Date(inv.paidAt).getTime() - new Date(inv.createdAt).getTime()) / 86400000
        );
        c.avgDaysToPayment = c.avgDaysToPayment === null
          ? days
          : Math.round((c.avgDaysToPayment + days) / 2);
      }
    } else if (inv.status !== "cancelled") {
      c.outstandingAmount += inv.amount;
    }
  }

  // Follow-up effectiveness: % of paid invoices that had at least 1 follow-up
  const paidWithFollowUp = paidInvoices.filter(i => i.followUps.length > 0).length;
  const followUpEffectiveness = paidInvoices.length > 0
    ? Math.round((paidWithFollowUp / paidInvoices.length) * 100)
    : 0;

  // Follow-up step distribution (how many invoices at each step)
  const followUpSteps = [0, 1, 2, 3].map(step => ({
    step,
    count: invoices.filter(i => i.followUpStep === step && i.status !== "paid" && i.status !== "cancelled").length,
  }));

  // Monthly collected (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyCollected: Record<string, number> = {};
  for (const inv of paidInvoices) {
    if (inv.paidAt && new Date(inv.paidAt) >= sixMonthsAgo) {
      const month = new Date(inv.paidAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyCollected[month] = (monthlyCollected[month] || 0) + inv.amount;
    }
  }

  return NextResponse.json({
    overall: {
      totalInvoices,
      paidInvoices: paidInvoices.length,
      collectionRate,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      followUpEffectiveness,
    },
    clients: Array.from(clientMap.values()).sort((a, b) => b.outstandingAmount - a.outstandingAmount),
    followUpSteps,
    monthlyCollected,
  });
}
