import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFollowUp } from "@/lib/followup";

/**
 * GET /api/cron/followups
 *
 * Automated follow-up scheduler — called by a cron job (e.g. Railway Cron,
 * Vercel Cron, or an external scheduler) on a regular interval (hourly or daily).
 *
 * What it does:
 * 1. Marks invoices as "overdue" when past dueDate and still "pending".
 * 2. Sends the next follow-up email for any invoice whose nextFollowUpAt <= now
 *    and that still has remaining follow-up steps (< 3).
 *
 * Security: protected by a shared secret in CRON_SECRET env var.
 *   The cron caller must pass:  Authorization: Bearer <CRON_SECRET>
 *   If CRON_SECRET is not set the endpoint is disabled (returns 403).
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured — endpoint disabled" },
      { status: 403 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: {
    overdueMarked: string[];
    followUpsSent: { invoiceId: string; step: number; subject: string }[];
    errors: { invoiceId: string; error: string }[];
  } = {
    overdueMarked: [],
    followUpsSent: [],
    errors: [],
  };

  // ── Step 1: Mark overdue invoices ────────────────────────────────────────
  // Any "pending" invoice whose dueDate has passed becomes "overdue".
  const overdueUpdate = await prisma.invoice.updateMany({
    where: {
      status: "pending",
      dueDate: { lt: now },
    },
    data: { status: "overdue" },
  });

  if (overdueUpdate.count > 0) {
    // Fetch their IDs for the log (secondary query is fine — low volume).
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "overdue",
        dueDate: { lt: now },
        lastFollowUpAt: null, // approximate: newly turned overdue
      },
      select: { id: true },
    });
    results.overdueMarked = overdueInvoices.map((i) => i.id);
  }

  // ── Step 2: Send due follow-ups ──────────────────────────────────────────
  // Invoices where nextFollowUpAt <= now, not yet at step 3, and not paid/cancelled.
  const dueInvoices = await prisma.invoice.findMany({
    where: {
      nextFollowUpAt: { lte: now },
      followUpStep: { lt: 3 },
      status: { notIn: ["paid", "cancelled"] },
    },
    select: { id: true },
  });

  for (const { id } of dueInvoices) {
    try {
      const result = await sendFollowUp(id);
      if (result) {
        results.followUpsSent.push({ invoiceId: id, ...result });
      }
    } catch (err) {
      results.errors.push({
        invoiceId: id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    overdueMarked: results.overdueMarked.length,
    followUpsSent: results.followUpsSent.length,
    errors: results.errors.length,
    details: results,
  });
}
