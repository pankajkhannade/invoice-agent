"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    key: "free",
    name: "Free",
    price: 0,
    desc: "For freelancers just getting started",
    features: [
      "3 invoices per month",
      "Basic follow-up sequences",
      "Invoice dashboard",
      "CSV export",
    ],
    cta: "Get started free",
    highlight: false,
    badge: "No credit card",
  },
  {
    key: "starter",
    name: "Starter",
    price: 29,
    desc: "For solo freelancers growing their practice",
    features: [
      "Up to 20 active invoices",
      "3-step follow-up sequences",
      "Email reminders",
      "Invoice dashboard",
    ],
    cta: "Start Starter plan",
    highlight: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: 59,
    desc: "For agencies & power users",
    features: [
      "Unlimited invoices",
      "Custom escalation rules",
      "Multi-client management",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Growth plan",
    highlight: true,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleChoose(planKey: string) {
    if (!session) {
      router.push("/register");
      return;
    }
    if (planKey === "free") {
      // Free plan doesn't need Stripe — just redirect to dashboard
      router.push("/dashboard");
      return;
    }
    setLoading(planKey);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b bg-white/80">
        <Link href="/" className="text-xl font-bold text-indigo-700">InvoiceAgent</Link>
        {session ? (
          <Link href="/dashboard" className="text-indigo-600 font-medium">Dashboard →</Link>
        ) : (
          <Link href="/login" className="text-indigo-600 font-medium">Sign in</Link>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-600 mb-16">Recover one invoice and pay for the year. No hidden fees.</p>

        <div className="grid grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.key}
              className={`rounded-2xl p-8 border text-left ${
                p.highlight
                  ? "border-indigo-500 shadow-lg bg-indigo-600 text-white"
                  : p.key === "free"
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-white"
              }`}>
              {p.badge && (
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${
                  p.highlight ? "bg-indigo-400 text-white" : "bg-green-100 text-green-700"
                }`}>{p.badge}</span>
              )}
              <div className={`text-sm font-semibold mb-1 ${p.highlight ? "text-indigo-200" : "text-indigo-600"}`}>{p.name}</div>
              <div className="text-4xl font-extrabold mb-1">
                {p.price === 0 ? "Free" : `$${p.price}`}
                <span className="text-lg font-normal opacity-70">
                  {p.price === 0 ? " forever" : "/mo"}
                </span>
              </div>
              <p className={`text-sm mb-6 ${p.highlight ? "text-indigo-200" : "text-gray-500"}`}>{p.desc}</p>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className={p.highlight ? "text-indigo-200" : "text-indigo-500"}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleChoose(p.key)}
                disabled={loading === p.key}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  p.highlight
                    ? "bg-white text-indigo-700 hover:bg-indigo-50"
                    : p.key === "free"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {loading === p.key ? "Redirecting..." : p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20 text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Compare plans</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Feature</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Free</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Starter</th>
                  <th className="text-center px-4 py-3 text-indigo-600 font-medium font-semibold">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ["Invoices per month", "3", "20", "Unlimited"],
                  ["Follow-up steps", "3", "3", "Custom"],
                  ["CSV export", "✓", "✓", "✓"],
                  ["Email reminders", "✓", "✓", "✓"],
                  ["Escalation rules", "—", "—", "✓"],
                  ["Analytics dashboard", "—", "—", "✓"],
                  ["Priority support", "—", "—", "✓"],
                ].map(([feature, free, starter, growth]) => (
                  <tr key={feature} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{feature}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{free}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{starter}</td>
                    <td className="px-4 py-3 text-center text-indigo-600 font-semibold">{growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Social proof / testimonials */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trusted by freelancers & agencies</h2>
          <div className="grid grid-cols-3 gap-6 text-left">
            {[
              {
                quote: "I had $4,200 stuck in overdue invoices from two clients. InvoiceAgent got me paid in under a week. Best $29 I ever spent.",
                name: "Arjun Mehta",
                role: "Freelance UX Designer, Mumbai",
                initials: "AM",
              },
              {
                quote: "As a small agency we were too embarrassed to chase clients ourselves. This handles it professionally and we've collected over $12k this quarter.",
                name: "Sarah Chen",
                role: "Founder, Pixel Studio",
                initials: "SC",
              },
              {
                quote: "The follow-up emails are polite but firm. My clients have actually thanked me for the 'gentle reminders.' ROI is unreal.",
                name: "Marcus Reid",
                role: "Independent Developer, London",
                initials: "MR",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex gap-1 text-yellow-400 mb-3">{"★".repeat(5)}</div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money-back guarantee */}
        <p className="mt-16 text-gray-500 text-sm">7-day free trial on paid plans. Cancel anytime.</p>
      </div>
    </div>
  );
}
