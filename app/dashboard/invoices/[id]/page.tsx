"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type FollowUp = {
  id: string;
  step: number;
  subject: string;
  body: string;
  sentAt: string;
};

type Invoice = {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  notes: string | null;
  followUpStep: number;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  paidAt: string | null;
  followUps: FollowUp[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const STEP_LABELS = ["", "Friendly reminder", "Second notice", "Final notice"];

export default function InvoiceDetailPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetch(`/api/invoices/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            router.push("/dashboard");
            return;
          }
          setInvoice(data);
          setLoading(false);
        });
    }
  }, [status, params.id, router]);

  async function handleStatusChange(newStatus: string) {
    if (!invoice) return;
    setUpdating(true);
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await fetch(`/api/invoices/${invoice.id}`).then((r) => r.json());
    setInvoice(updated);
    setUpdating(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!invoice) return null;

  const dueDate = new Date(invoice.dueDate);
  const nextFollowUp = invoice.nextFollowUpAt
    ? new Date(invoice.nextFollowUpAt)
    : null;
  const isOpen = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">
          InvoiceAgent
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Invoice Details */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {invoice.clientName}
              </h1>
              <p className="text-gray-500">{invoice.clientEmail}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                STATUS_COLORS[invoice.status] || ""
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Amount</div>
              <div className="text-xl font-bold text-gray-900">
                {invoice.currency} {invoice.amount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Due date</div>
              <div className="text-lg font-semibold text-gray-900">
                {dueDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Follow-up step</div>
              <div className="text-lg font-semibold text-gray-900">
                {invoice.followUpStep}/3
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-5 pt-5 border-t">
              <div className="text-sm text-gray-500 mb-1">Notes</div>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Next scheduled follow-up */}
        {isOpen && nextFollowUp && (
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 mb-6">
            <div className="text-sm text-indigo-600 font-semibold mb-1">
              Next scheduled follow-up
            </div>
            <div className="text-gray-900 font-medium">
              {nextFollowUp.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              —{" "}
              <span className="text-indigo-700">
                {STEP_LABELS[invoice.followUpStep + 1] || "Final notice"}
              </span>
            </div>
          </div>
        )}

        {isOpen && !nextFollowUp && invoice.followUpStep >= 3 && (
          <div className="bg-gray-100 rounded-xl border p-5 mb-6">
            <div className="text-gray-600 font-medium">
              All 3 follow-up steps completed. No further automatic follow-ups
              scheduled.
            </div>
          </div>
        )}

        {/* Follow-up timeline */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Follow-up history
          </h2>

          {invoice.followUps.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No follow-ups sent yet
            </div>
          ) : (
            <div className="space-y-0">
              {invoice.followUps.map((fu, i) => {
                const sentAt = new Date(fu.sentAt);
                const isLast = i === invoice.followUps.length - 1;
                return (
                  <div key={fu.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          isLast ? "bg-indigo-600" : "bg-gray-400"
                        }`}
                      >
                        {fu.step}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-full bg-gray-200 min-h-[60px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {STEP_LABELS[fu.step] || `Step ${fu.step}`}
                        </span>
                        <span className="text-sm text-gray-400">
                          {sentAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {sentAt.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-indigo-700 mb-1">
                        {fu.subject}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {fu.body.length > 300
                          ? fu.body.slice(0, 300) + "..."
                          : fu.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status actions */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex gap-3">
            {isOpen && (
              <>
                <button
                  onClick={() => handleStatusChange("paid")}
                  disabled={updating}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Mark as paid
                </button>
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={updating}
                  className="bg-gray-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel invoice
                </button>
              </>
            )}
            {!isOpen && (
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={updating}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
