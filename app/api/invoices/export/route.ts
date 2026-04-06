import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: { followUps: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Client Name",
    "Client Email",
    "Amount",
    "Currency",
    "Due Date",
    "Status",
    "Follow-up Step",
    "Notes",
    "Created At",
  ];

  const rows = invoices.map((inv) => [
    escapeCSV(inv.clientName),
    escapeCSV(inv.clientEmail),
    inv.amount,
    escapeCSV(inv.currency),
    inv.dueDate.toISOString().split("T")[0],
    escapeCSV(inv.status),
    inv.followUpStep,
    escapeCSV(inv.notes ?? ""),
    inv.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
