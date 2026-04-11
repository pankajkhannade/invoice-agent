"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Template = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  clientNamePlaceholder: string;
  amountPlaceholder: string;
  currency: string;
  dueDateOffsetDays: number;
  defaultNotes: string;
  bg: string;
  border: string;
};

const TEMPLATES: Template[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Clean, simple invoice for most clients. Standard 30-day terms.",
    emoji: "📄",
    clientNamePlaceholder: "Client Name",
    amountPlaceholder: "1,000",
    currency: "USD",
    dueDateOffsetDays: 30,
    defaultNotes: "",
    bg: "bg-white",
    border: "border-gray-200",
  },
  {
    id: "detailed",
    name: "Detailed",
    description: "For complex projects with line items and scope description.",
    emoji: "📊",
    clientNamePlaceholder: "Client Name",
    amountPlaceholder: "5,000",
    currency: "USD",
    dueDateOffsetDays: 14,
    defaultNotes: "Thank you for your business. Payment due within 14 days.",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "creative",
    name: "Creative",
    description: "For creative agencies and freelancers. Bold & expressive.",
    emoji: "🎨",
    clientNamePlaceholder: "Creative Studio Client",
    amountPlaceholder: "2,500",
    currency: "USD",
    dueDateOffsetDays: 21,
    defaultNotes: "Includes 2 rounds of revisions. Additional revisions billed separately.",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-minimal for enterprise clients who just need the numbers.",
    emoji: "⚡",
    clientNamePlaceholder: "Acme Corp",
    amountPlaceholder: "750",
    currency: "USD",
    dueDateOffsetDays: 7,
    defaultNotes: "Net 7. PO# required on remittance.",
    bg: "bg-gray-50",
    border: "border-gray-300",
  },
  {
    id: "gst",
    name: "GST / INR",
    description: "Indian rupee invoice with GST details — for Indian freelancers & agencies.",
    emoji: "🇮🇳",
    clientNamePlaceholder: "Client Name",
    amountPlaceholder: "50,000",
    currency: "INR",
    dueDateOffsetDays: 30,
    defaultNotes: "GSTIN: XXXXXXXXXXXXXX | SAC: 999XXX | Net 30. Payment via NEFT/RTGS/UPI.",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
];

function buildTemplateQS(t: Template): string {
  const params = new URLSearchParams({
    template: t.id,
    clientName: t.clientNamePlaceholder,
    amount: t.amountPlaceholder,
    currency: t.currency,
    dueDateOffset: String(t.dueDateOffsetDays),
    notes: t.defaultNotes,
  });
  return `/dashboard/invoices/new?${params.toString()}`;
}

export default function TemplatesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">InvoiceAgent</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link>
          <Link href="/dashboard/invoices" className="text-gray-500 hover:text-gray-700">Invoices</Link>
          <Link href="/dashboard/invoices/templates" className="text-indigo-600 font-semibold">Templates</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Templates</h1>
            <p className="text-gray-500 text-sm mt-1">Pick a template to pre-fill your invoice</p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Blank invoice →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className={`${t.bg} rounded-xl border ${t.border} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="text-3xl mb-3">{t.emoji}</div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{t.description}</p>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 mb-5">
                <div>
                  <span className="font-medium text-gray-700">Currency:</span> {t.currency}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due date:</span> +{t.dueDateOffsetDays} days
                </div>
                {t.defaultNotes && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Notes:</span> {t.defaultNotes.length > 60
                      ? t.defaultNotes.slice(0, 60) + "…"
                      : t.defaultNotes}
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push(buildTemplateQS(t))}
                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Use this template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
