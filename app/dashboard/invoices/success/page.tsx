"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

type FirstInvoiceStats = {
  count: number;
  isFirstInvoice: boolean;
  isFreePlan: boolean;
};

function SuccessContent() {
  const params = useSearchParams();
  const [stats, setStats] = useState<FirstInvoiceStats | null>(null);

  const clientName = params.get("client") || "your client";
  const amount = params.get("amount") || "";
  const currency = params.get("currency") || "USD";

  useEffect(() => {
    fetch("/api/invoices/stats/first")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => null);
  }, []);

  const isFirst = stats?.isFirstInvoice ?? false;
  const isFreePlan = stats?.isFreePlan ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* First-invoice celebration banner */}
        {isFirst && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-left">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎊</span>
              <div>
                <div className="font-bold text-amber-900 text-sm mb-1">First invoice created!</div>
                <p className="text-amber-700 text-xs leading-relaxed">
                  You&apos;re officially in the game. This is the hardest step — now let&apos;s get you paid.
                  {isFreePlan && (
                    <span> You&apos;re on the free plan — upgrade to Growth to send invoices to unlimited clients.</span>
                  )}
                </p>
                {isFreePlan && (
                  <Link
                    href="/pricing"
                    className="inline-block mt-2 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600"
                  >
                    Upgrade for unlimited →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Standard celebration */}
        <div className="text-6xl mb-6">{isFirst ? "🚀" : "🎉"}</div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {isFirst ? "Welcome aboard — invoice sent!" : "Your invoice is on its way!"}
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
                desc: "If payment isn&apos;t received, we&apos;ll send polite reminders automatically.",
              },
              {
                icon: "⏰",
                title: "You stay in control",
                desc: "All emails are sent from your address — you&apos;re always in the loop.",
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
                  <div className="font-medium text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: title }} />
                  <div className="text-gray-500 text-sm" dangerouslySetInnerHTML={{ __html: desc }} />
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
