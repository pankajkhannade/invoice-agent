import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, sanitized site-level stats for social proof on marketing pages.
// No per-user or per-invoice data is exposed.
export async function GET() {
  try {
    const [totalInvoices, paidInvoices, totalUsers] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: "paid" } }),
      prisma.user.count({ where: { email: { not: null } } }),
    ]);

    const collectionRate = totalInvoices > 0
      ? Math.round((paidInvoices / totalInvoices) * 100)
      : 0;

    return NextResponse.json({
      totalInvoices,
      totalUsers,
      collectionRate,
    });
  } catch {
    // If DB is unavailable, return safe fallback — don't break the page
    return NextResponse.json({
      totalInvoices: 0,
      totalUsers: 0,
      collectionRate: 0,
    });
  }
}