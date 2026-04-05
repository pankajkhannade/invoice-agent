"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  followUpStep: number;
};

type ClientGroup = {
  clientEmail: string;
  clientName: string;
  invoices: Invoice[];
  totalAmount: number;
  outstandingAmount: number;
  paidAmount: number;
  invoiceCount: number;
  overdueCount: number;
};

export default function ClientsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then((r) => r.json())
        .then((data: Invoice[]) => {
          if (!Array.isArray(data)) { setLoading(false); return; }

          const map = new Map<string, ClientGroup>();
          for (const inv of data) {
            if (!map.has(inv.clientEmail)) {
              map.set(inv.clientEmail, {
                clientEmail: inv.clientEmail,
                clientName: inv.clientName,
                invoices: [],
                totalAmount: 0,
                outstandingAmount: 0,
                paidAmount: 0,
                invoiceCount: 0,
                overdueCount: 0,
              });
            }
            const g = map.get(inv.clientEmail)!;
            g.invoices.push(inv);
            g.totalAmount += inv.amount;
            g.invoiceCount += 1;
            if (inv.status === "paid") g.paidAmount += inv.amount;
            else if (inv.status !== "cancelled") {
              g.outstandingAmount += inv.amount;
              if (inv.status === "overdue") g.overdueCount += 1;
            }
          }
          setClientGroups(
            Array.from(map.values()).sort((a, b) => b.outstandingAmount - a.outstandingAmount)
          );
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

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const selected = selectedClient
    ? clientGroups.find((c) => c.clientEmail === selectedClient)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">
          InvoiceAgent
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link>
          <Link href="/dashboard/clients" className="text-indigo-600 font-semibold">Clients</Link>
          <Link href="/dashboard/analytics" className="text-gray-500 hover:text-gray-700">Analytics</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-500 text-sm mt-1">{clientGroups.length} clients · grouped by email</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            Growth Plan
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Client list */}
          <div className="col-span-1 bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">All clients</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {clientGroups.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No clients yet</p>
              ) : clientGroups.map((g) => (
                <button
                  key={g.clientEmail}
                  onClick={() => setSelectedClient(g.clientEmail === selectedClient ? null : g.clientEmail)}
                  className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors ${
                    selectedClient === g.clientEmail ? "bg-indigo-50 border-l-2 border-indigo-600" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{g.clientName}</div>
                  <div className="text-xs text-gray-500">{g.clientEmail}</div>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-gray-500">{g.invoiceCount} invoices</span>
                    {g.overdueCount > 0 && (
                      <span className="text-red-600 font-medium">{g.overdueCount} overdue</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Client detail / empty state */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl border p-16 text-center">
                <div className="text-4xl mb-4">👆</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a client</h3>
                <p className="text-gray-500 text-sm">Click a client on the left to see their invoice history</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selected.clientName}</h2>
                    <p className="text-gray-500 text-sm">{selected.clientEmail}</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-gray-900">${selected.totalAmount.toFixed(0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Collected</div>
                      <div className="font-bold text-green-600">${selected.paidAmount.toFixed(0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Outstanding</div>
                      <div className="font-bold text-red-600">${selected.outstandingAmount.toFixed(0)}</div>
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["Amount", "Due date", "Status", "Follow-ups", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selected.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold">{inv.currency} {inv.amount.toFixed(2)}</td>
                        <td className="px-4 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || ""}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{inv.followUpStep}/3</td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="text-indigo-600 text-xs font-medium hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
