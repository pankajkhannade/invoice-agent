"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly — warm and understanding" },
  { value: "firm", label: "Firm — professional and direct" },
  { value: "final", label: "Final — urgent and final notice" },
];

export default function EscalationSettingsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [_config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstFollowUpDays: "7",
    secondFollowUpDays: "14",
    thirdFollowUpDays: "21",
    firstFollowUpTone: "friendly",
    secondFollowUpTone: "firm",
    thirdFollowUpTone: "final",
    autoEscalateAfterDays: "14",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/escalation-config")
        .then((r) => {
          if (r.status === 403) { setLoading(false); return null; }
          return r.json();
        })
        .then((data) => {
          if (data) {
            setConfig(data);
            setForm({
              firstFollowUpDays: String(data.firstFollowUpDays || 7),
              secondFollowUpDays: String(data.secondFollowUpDays || 14),
              thirdFollowUpDays: String(data.thirdFollowUpDays || 21),
              firstFollowUpTone: data.firstFollowUpTone || "friendly",
              secondFollowUpTone: data.secondFollowUpTone || "firm",
              thirdFollowUpTone: data.thirdFollowUpTone || "final",
              autoEscalateAfterDays: String(data.autoEscalateAfterDays || 14),
            });
          }
          setLoading(false);
        });
    }
  }, [status, router]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/user/escalation-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">
          InvoiceAgent
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escalation Rules</h1>
            <p className="text-gray-500 text-sm mt-1">Customise when and how follow-ups are sent</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            Growth Plan
          </span>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 space-y-8">
          {/* Follow-up timing */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Follow-up timing</h2>
            <div className="space-y-4">
              {[
                { key: "firstFollowUpDays", label: "Days after due date to send friendly reminder", step: "Step 1" },
                { key: "secondFollowUpDays", label: "Days after due date to send second notice", step: "Step 2" },
                { key: "thirdFollowUpDays", label: "Days after due date to send final notice", step: "Step 3" },
                { key: "autoEscalateAfterDays", label: "Days after due date to escalate tone to firm", step: "Auto-escalate" },
              ].map(({ key, label, step }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-500">{step}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-500">days</span>
                  </div>
                  <div className="text-sm text-gray-600 flex-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="pt-4 border-t">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Follow-up tone</h2>
            <div className="space-y-4">
              {[
                { key: "firstFollowUpTone", step: "Step 1 — Friendly reminder" },
                { key: "secondFollowUpTone", step: "Step 2 — Second notice" },
                { key: "thirdFollowUpTone", step: "Step 3 — Final notice" },
              ].map(({ key, step }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-gray-500">{step}</div>
                  <select
                    value={form[key as keyof typeof form]}
                    onChange={(e) => set(key, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
              Settings saved successfully.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save escalation rules"}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
