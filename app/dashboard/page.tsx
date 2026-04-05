"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import FollowUpModal from "./FollowUpModal";

type Invoice = {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  followUpStep: number;
  followUps: { id: string; step: number; sentAt: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

function UpgradeBanner() {
  const searchParams = useSearchParams();
  if (!searchParams.get("upgraded")) return null;
  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-sm">
      🎉 Welcome to the team! Your plan is now active.
    </div>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ invoiceId: string; invoiceName: string; step: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then(r => r.json())
        .then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); });
    }
  }, [status]);

  async function handleMarkPaid(invoiceId: string) {
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    const data = await fetch("/api/invoices").then(r => r.json());
    setInvoices(Array.isArray(data) ? data : []);
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  const overdue = invoices.filter(i => i.status === "overdue").length;
  const totalOwed = invoices
    .filter(i => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-indigo-700">InvoiceAgent</Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard/analytics" className="text-sm text-gray-500 hover:text-gray-700">Analytics</Link>
          <Link href="/dashboard/clients" className="text-sm text-gray-500 hover:text-gray-700">Clients</Link>
          <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-700">Settings</Link>
          <span className="text-sm text-gray-600">{session?.user?.email}</span>
          <Link href="/pricing" className="text-sm text-indigo-600 font-medium">Upgrade</Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <Suspense fallback={null}><UpgradeBanner /></Suspense>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <Link href="/dashboard/invoices/new"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
            + Add invoice
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500 mb-1">Total outstanding</div>
            <div className="text-2xl font-bold text-gray-900">${totalOwed.toFixed(0)}</div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500 mb-1">Overdue invoices</div>
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500 mb-1">Total invoices</div>
            <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border p-16 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No invoices yet</h3>
            <p className="text-gray-500 mb-6">Add your first invoice to start automating follow-ups.</p>
            <Link href="/dashboard/invoices/new" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
              Add first invoice
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Client", "Amount", "Due date", "Status", "Follow-ups", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{inv.clientName}</div>
                      <div className="text-gray-500">{inv.clientEmail}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold">{inv.currency} {inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || ""}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {inv.followUpStep}/3 sent
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {inv.status !== "paid" && inv.status !== "cancelled" && inv.followUpStep < 3 && (
                          <button
                            onClick={() => setPreviewModal({ invoiceId: inv.id, invoiceName: inv.clientName, step: inv.followUpStep + 1 })}
                            disabled={sendingId === inv.id}
                            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded font-medium hover:bg-indigo-100 disabled:opacity-50"
                          >
                            Send step {inv.followUpStep + 1}
                          </button>
                        )}
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded font-medium hover:bg-green-100"
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {previewModal && (
          <FollowUpModal
            invoiceId={previewModal.invoiceId}
            invoiceName={previewModal.invoiceName}
            step={previewModal.step}
            onClose={() => setPreviewModal(null)}
            onSent={() => {
              const id = previewModal.invoiceId;
              setPreviewModal(null);
              setSendingId(id);
              fetch("/api/invoices")
                .then((r) => r.json())
                .then((data) => { setInvoices(Array.isArray(data) ? data : []); setSendingId(null); });
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
