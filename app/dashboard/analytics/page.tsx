"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type ClientStats = {
  clientName: string;
  clientEmail: string;
  totalInvoices: number;
  paidInvoices: number;
  totalAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  avgDaysToPayment: number | null;
  followUpEffectiveness: number;
};

type Analytics = {
  overall: {
    totalInvoices: number;
    paidInvoices: number;
    collectionRate: number;
    totalCollected: number;
    totalOutstanding: number;
    followUpEffectiveness: number;
  };
  clients: ClientStats[];
  followUpSteps: { step: number; count: number }[];
  monthlyCollected: Record<string, number>;
};

export default function AnalyticsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/analytics")
        .then((r) => {
          if (r.status === 403) {
            router.push("/dashboard");
            return null;
          }
          return r.json();
        })
        .then((data) => {
          if (data) setAnalytics(data);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!analytics) return null;

  const { overall, clients, followUpSteps } = analytics;
  const monthlyKeys = Object.keys(analytics.monthlyCollected).sort().slice(-6);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">
          InvoiceAgent
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link>
          <Link href="/dashboard/analytics" className="text-indigo-600 font-semibold">Analytics</Link>
          <Link href="/dashboard/clients" className="text-gray-500 hover:text-gray-700">Clients</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Collection performance and insights</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            Growth Plan
          </span>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Collection rate", value: `${overall.collectionRate}%`, color: "text-green-600" },
            { label: "Total collected", value: `$${overall.totalCollected.toFixed(0)}`, color: "text-gray-900" },
            { label: "Outstanding", value: `$${overall.totalOutstanding.toFixed(0)}`, color: "text-red-600" },
            { label: "Follow-up effectiveness", value: `${overall.followUpEffectiveness}%`, color: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-5">
              <div className="text-sm text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Follow-up funnel */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Follow-up funnel</h2>
            <div className="space-y-3">
              {[
                { label: "No follow-ups sent", step: 0, color: "bg-gray-400" },
                { label: "Friendly reminder sent", step: 1, color: "bg-yellow-400" },
                { label: "Second notice sent", step: 2, color: "bg-orange-400" },
                { label: "Final notice sent", step: 3, color: "bg-red-400" },
              ].map(({ label, step, color }) => {
                const item = followUpSteps.find(s => s.step === step);
                const count = item?.count || 0;
                const max = Math.max(...followUpSteps.map(s => s.count), 1);
                return (
                  <div key={step}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.round((count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoice breakdown */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total invoices</span>
                <span className="font-bold text-gray-900">{overall.totalInvoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid</span>
                <span className="font-bold text-green-600">{overall.paidInvoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Outstanding</span>
                <span className="font-bold text-red-600">{overall.totalInvoices - overall.paidInvoices}</span>
              </div>
            </div>
          </div>

          {/* Monthly collected */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly collected (last 6 mo)</h2>
            <div className="space-y-2">
              {monthlyKeys.length === 0 ? (
                <p className="text-gray-400 text-sm">No paid invoices yet</p>
              ) : (
                monthlyKeys.map((month) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{month}</span>
                    <span className="font-semibold text-green-600">
                      ${(analytics.monthlyCollected[month] || 0).toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Per-client table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Per-client performance</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Client", "Total invoices", "Paid", "Total amount", "Collected", "Outstanding", "Avg days to pay"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No data yet</td></tr>
              ) : clients.map((c) => (
                <tr key={c.clientEmail} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{c.clientName}</div>
                    <div className="text-gray-500 text-xs">{c.clientEmail}</div>
                  </td>
                  <td className="px-4 py-4 font-medium">{c.totalInvoices}</td>
                  <td className="px-4 py-4">
                    <span className="text-green-600 font-medium">{c.paidInvoices}</span>
                  </td>
                  <td className="px-4 py-4">${c.totalAmount.toFixed(0)}</td>
                  <td className="px-4 py-4 text-green-600 font-medium">${c.collectedAmount.toFixed(0)}</td>
                  <td className="px-4 py-4 text-red-600 font-medium">${c.outstandingAmount.toFixed(0)}</td>
                  <td className="px-4 py-4 text-gray-600">
                    {c.avgDaysToPayment !== null ? `${c.avgDaysToPayment}d` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
