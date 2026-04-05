"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type BillingInfo = {
  plan: string;
  planName: string;
  stripeCustomerId: string | null;
  subscriptionId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  // Delete state
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      setName(session?.user?.name || "");
      setEmail(session?.user?.email || "");
      fetch("/api/user/billing")
        .then((r) => r.json())
        .then((data) => { setBilling(data); setLoadingBilling(false); });
    }
  }, [status, session]);

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/user/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ return_url: `${window.location.origin}/dashboard` }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortalLoading(false);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setProfileSaving(false);
    setProfileMsg(data.error || "Profile saved");
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (data.error) {
      setPwMsg(data.error);
    } else {
      setPwMsg("Password updated");
      setCurrentPw("");
      setNewPw("");
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleteLoading(true);
    const res = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmEmail }),
    });
    const data = await res.json();
    if (data.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setDeleteLoading(false);
    }
  }

  if (status === "loading" || loadingBilling) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  const periodEnd = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd * 1000).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;
  const periodStart = billing?.currentPeriodStart
    ? new Date(billing.currentPeriodStart * 1000).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">InvoiceAgent</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Billing */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Billing &amp; Subscription</h2>

          {billing?.stripeCustomerId ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-sm text-gray-500">Current plan</div>
                  <div className="font-semibold text-gray-900">{billing.planName}</div>
                </div>
                {billing.status && (
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-semibold text-gray-900 capitalize">{billing.status}</div>
                  </div>
                )}
                {periodStart && (
                  <div>
                    <div className="text-sm text-gray-500">Billing period</div>
                    <div className="font-medium text-gray-700">{periodStart} – {periodEnd}</div>
                  </div>
                )}
                {billing.amount !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="font-semibold text-gray-900">
                      ${billing.amount}/{billing.currency === "usd" ? "mo" : billing.currency}
                    </div>
                  </div>
                )}
                {billing.cancelAtPeriodEnd && (
                  <div className="col-span-2">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg">
                      ⚠️ Subscription cancels on {periodEnd} — you will lose access to {billing.planName} features.
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </button>
              <p className="text-xs text-gray-400 mt-2">Opens Stripe's secure customer portal to change or cancel your plan.</p>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">You are on the free plan.</p>
              <Link href="/pricing" className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
                Upgrade your plan →
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg === "Profile saved" ? "text-green-600" : "text-red-600"}`}>
                {profileMsg}
              </p>
            )}
            <button type="submit" disabled={profileSaving}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {profileSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password (min 8 chars)</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg === "Password updated" ? "text-green-600" : "text-red-600"}`}>
                {pwMsg}
              </p>
            )}
            <button type="submit" disabled={pwSaving}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {pwSaving ? "Saving..." : "Update password"}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="text-base font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 text-sm"
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Type your email <strong>{session?.user?.email}</strong> to confirm:
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                placeholder={session?.user?.email || ""}
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading || confirmEmail !== session?.user?.email}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {deleteLoading ? "Deleting..." : "Yes, permanently delete"}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setConfirmEmail(""); }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
