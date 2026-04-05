import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur">
        <span className="text-xl font-bold text-indigo-700">InvoiceAgent</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-indigo-700 font-medium">Log in</Link>
          <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">Get started</Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full mb-6">
          Stop chasing invoices. Start getting paid.
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          AI-powered invoice follow-ups<br />that actually get results
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          InvoiceAgent sends personalized, escalating payment reminders on your behalf — 
          friendly first, firm when needed. Freelancers recover <strong>30–60× their monthly fee</strong> in the first invoice alone.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700">
            Start free — 1 invoice included
          </Link>
          <Link href="/pricing" className="border border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold text-gray-700 hover:border-indigo-400">
            See pricing
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-3 gap-8">
        {[
          { icon: "✉️", title: "3-step sequences", desc: "Friendly → Firm → Final. Calibrated to client relationship and invoice size." },
          { icon: "⚡", title: "One-click send", desc: "Review and fire from your dashboard. No awkward email drafting ever again." },
          { icon: "📊", title: "Track everything", desc: "Know exactly which invoices are overdue, sent, and paid at a glance." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
