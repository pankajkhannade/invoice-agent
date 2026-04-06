"use client";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type QuickTemplate = {
  id: string;
  name: string;
  emoji: string;
  clientName: string;
  currency: string;
  dueDateOffset: number;
  notes: string;
};

const QUICK_TEMPLATES: QuickTemplate[] = [
  { id: "basic", name: "Basic", emoji: "📄", clientName: "", currency: "USD", dueDateOffset: 30, notes: "" },
  { id: "detailed", name: "Detailed", emoji: "📊", clientName: "", currency: "USD", dueDateOffset: 14, notes: "Thank you for your business. Payment due within 14 days." },
  { id: "creative", name: "Creative", emoji: "🎨", clientName: "", currency: "USD", dueDateOffset: 21, notes: "Includes 2 rounds of revisions. Additional revisions billed separately." },
  { id: "minimal", name: "Minimal", emoji: "⚡", clientName: "", currency: "USD", dueDateOffset: 7, notes: "Net 7. PO# required on remittance." },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function NewInvoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const templateParam = searchParams.get("template");
  const prefilledClientName = searchParams.get("clientName") || "";
  const prefilledCurrency = searchParams.get("currency") || "USD";
  const prefilledNotes = searchParams.get("notes") || "";
  const prefilledDueDateOffset = parseInt(searchParams.get("dueDateOffset") || "30", 10);

  const [form, setForm] = useState({
    clientName: prefilledClientName,
    clientEmail: "",
    amount: searchParams.get("amount") || "",
    currency: prefilledCurrency,
    dueDate: addDays(prefilledDueDateOffset),
    notes: prefilledNotes,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyQuickTemplate(t: QuickTemplate) {
    setForm((prev) => ({
      ...prev,
      clientName: t.clientName,
      currency: t.currency,
      dueDate: addDays(t.dueDateOffset),
      notes: t.notes,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      if (data.upgrade) {
        setError("You've reached your plan's invoice limit. Upgrade to Growth for unlimited invoices.");
        setLoading(false);
        return;
      }
      setError(data.error || "Failed to create invoice");
      setLoading(false);
      return;
    }
    const created = await res.json();
    const qs = new URLSearchParams({
      client: encodeURIComponent(created.clientName || form.clientName),
      amount: encodeURIComponent(String(created.amount || form.amount)),
      currency: encodeURIComponent(created.currency || form.currency),
    });
    router.push(`/dashboard/invoices/success?${qs}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">InvoiceAgent</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to dashboard</Link>
        </div>

        <div className="bg-white rounded-xl border p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add invoice</h1>
            <Link href="/dashboard/invoices/bulk" className="text-sm text-indigo-600 hover:underline font-medium">
              Import from CSV →
            </Link>
          </div>

          {/* Quick template picker */}
          {!templateParam && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Use a template?</div>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyQuickTemplate(t)}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className="text-xs font-semibold text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-400">+{t.dueDateOffset}d</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {templateParam && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 flex items-center gap-2">
              <span>✨</span>
              Template pre-filled: {templateParam} —{" "}
              <Link href="/dashboard/invoices/new" className="underline font-medium">start blank</Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
              {error}
              <div className="mt-2">
                <Link href="/pricing" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                  Upgrade to Growth
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client name *</label>
                <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client email *</label>
                <input type="email" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {["USD", "EUR", "GBP", "AUD", "CAD", "INR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date *</label>
              <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {loading ? "Saving..." : "Add invoice"}
              </button>
              <Link href="/dashboard" className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
