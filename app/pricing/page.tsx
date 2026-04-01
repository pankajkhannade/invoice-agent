"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: 29,
    desc: "Perfect for solo freelancers",
    features: ["Up to 20 active invoices", "3-step follow-up sequences", "Email reminders", "Invoice dashboard"],
    cta: "Start Starter plan",
  },
  {
    key: "growth",
    name: "Growth",
    price: 59,
    desc: "For agencies & power users",
    features: ["Unlimited invoices", "Custom escalation rules", "Multi-client management", "Analytics dashboard", "Priority support"],
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

      <div className="max-w-4xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-600 mb-16">Recover one invoice and pay for the year. No hidden fees.</p>

        <div className="grid grid-cols-2 gap-8">
          {plans.map(p => (
            <div key={p.key}
              className={`rounded-2xl p-8 border text-left ${p.highlight ? "border-indigo-500 shadow-lg bg-indigo-600 text-white" : "border-gray-200 bg-white"}`}>
              <div className={`text-sm font-semibold mb-1 ${p.highlight ? "text-indigo-200" : "text-indigo-600"}`}>{p.name}</div>
              <div className="text-4xl font-extrabold mb-1">${p.price}<span className="text-lg font-normal opacity-70">/mo</span></div>
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
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {loading === p.key ? "Redirecting..." : p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-gray-500 text-sm">7-day money-back guarantee. Cancel anytime.</p>
      </div>
    </div>
  );
}
