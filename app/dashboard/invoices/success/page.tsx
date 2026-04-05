"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const clientName = params.get("client") || "your client";
  const amount = params.get("amount") || "";
  const currency = params.get("currency") || "USD";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Confetti / celebration */}
        <div className="text-6xl mb-6">🎉</div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Your invoice is on its way!
        </h1>
        <p className="text-gray-500 mb-8 text-lg">
          Invoice of <span className="font-semibold text-gray-800">{currency} {amount}</span> to{" "}
          <span className="font-semibold text-gray-800">{clientName}</span> has been created.
        </p>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-800 mb-4">What happens next?</h2>
          <ul className="space-y-3">
            {[
              {
                icon: "📧",
                title: "Follow-up sequence starts",
                desc: "If payment isn't received, we'll send polite reminders automatically.",
              },
              {
                icon: "⏰",
                title: "You stay in control",
                desc: "All emails are sent from your address — you're always in the loop.",
              },
              {
                icon: "📊",
                title: "Track everything here",
                desc: "See invoice status, responses, and collection analytics in your dashboard.",
              },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <div className="font-medium text-gray-800 text-sm">{title}</div>
                  <div className="text-gray-500 text-sm">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 text-center"
          >
            View dashboard →
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 text-center"
          >
            Add another invoice
          </Link>
        </div>

        {/* Invite nudge */}
        <p className="mt-6 text-sm text-gray-400">
          Recovering invoices saves you time.{" "}
          <Link href="/dashboard/settings" className="text-indigo-500 hover:underline">
            Set up escalation rules
          </Link>{" "}
          to customize follow-up timing.
        </p>
      </div>
    </div>
  );
}

export default function InvoiceSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
