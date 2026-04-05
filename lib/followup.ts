import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const EMAIL_REQUIRED_VARS = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
] as const;

export function validateSmtpConfig(): { valid: boolean; missing: string[] } {
  const missing = EMAIL_REQUIRED_VARS.filter(
    (v) => !process.env[v] || process.env[v]!.trim() === ""
  );
  return { valid: missing.length === 0, missing: [...missing] };
}

function createTransporter(): nodemailer.Transporter {
  const { valid, missing } = validateSmtpConfig();
  if (!valid) {
    console.error(
      `[FollowUp] SMTP config validation failed — missing: ${missing.join(", ")}`
    );
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

const transporter = createTransporter();

export function getFollowUpTemplate(
  step: number,
  invoice: { id: string; clientName: string; clientEmail: string; amount: number; currency: string; dueDate: Date; user: { name: string | null; email: string | null } }
) {
  const fromName = invoice.user.name || "Your Service Provider";
  const amount = `${invoice.currency} ${invoice.amount.toFixed(2)}`;
  const due = new Date(invoice.dueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const daysOverdue = Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / 86400000
  );

  if (step === 1) {
    return {
      subject: `Friendly reminder: Invoice for ${amount} due ${due}`,
      body: `Hi ${invoice.clientName},

I hope you're doing well! This is a friendly reminder that invoice #${invoice.id.slice(-6).toUpperCase()} for ${amount} was due on ${due}.

If you've already sent payment, please disregard this message. If not, could you let me know when I can expect it?

Thank you so much — I really appreciate working with you.

Best,
${fromName}`,
    };
  }

  if (step === 2) {
    return {
      subject: `Second notice: Invoice ${amount} now ${daysOverdue} days overdue`,
      body: `Hi ${invoice.clientName},

I wanted to follow up again on invoice #${invoice.id.slice(-6).toUpperCase()} for ${amount}, which was due on ${due} and is now ${daysOverdue} days past due.

I'd appreciate prompt payment to keep our working relationship in good standing. Please reply if there's any issue or if you need to discuss payment arrangements.

Thanks,
${fromName}`,
    };
  }

  return {
    subject: `Final notice: Invoice ${amount} — immediate action required`,
    body: `Hi ${invoice.clientName},

This is a final notice for invoice #${invoice.id.slice(-6).toUpperCase()} for ${amount}, now ${daysOverdue} days overdue.

I need to receive payment or hear from you within 5 business days to avoid escalating this matter further. Please reply immediately to resolve this.

Regards,
${fromName}`,
  };
}

export interface SendFollowUpResult {
  step?: number;
  subject?: string;
  error?: string;
}

export async function sendFollowUp(invoiceId: string, customSubject?: string, customBody?: string): Promise<SendFollowUpResult> {
  const { valid } = validateSmtpConfig();
  if (!valid) {
    const err = "SMTP configuration is missing or incomplete. Please contact support.";
    console.error(
      `[FollowUp] Failed to send follow-up for invoice=${invoiceId}: SMTP config invalid`
    );
    return { error: err };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: true },
  });
  if (!invoice || invoice.status === "paid" || invoice.status === "cancelled") {
    return {};
  }

  const nextStep = Math.min((invoice.followUpStep || 0) + 1, 3);
  const { subject: tmplSubject, body: tmplBody } = getFollowUpTemplate(nextStep, invoice);
  const subject = customSubject || tmplSubject;
  const body = customBody || tmplBody;

  try {
    await transporter.sendMail({
      from: `"${invoice.user.name || "Invoice Agent"}" <${process.env.EMAIL_FROM}>`,
      to: invoice.clientEmail,
      replyTo: invoice.user.email || undefined,
      subject,
      text: body,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[FollowUp] SMTP error for invoice=${invoiceId} step=${nextStep}: ${errorMsg}`
    );
    return {
      error: "Failed to send follow-up email. Please try again later or contact support.",
    };
  }

  const now = new Date();
  const nextFollowUp =
    nextStep < 3 ? new Date(now.getTime() + (nextStep === 1 ? 7 : 14) * 86400000) : null;

  await prisma.$transaction([
    prisma.followUp.create({
      data: { invoiceId, step: nextStep, subject, body },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        followUpStep: nextStep,
        lastFollowUpAt: now,
        nextFollowUpAt: nextFollowUp,
        status: invoice.status === "pending" ? "overdue" : invoice.status,
      },
    }),
  ]);

  return { step: nextStep, subject };
}
