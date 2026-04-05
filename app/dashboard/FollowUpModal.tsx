"use client";
import { useState, useEffect } from "react";

type Props = {
  invoiceId: string;
  invoiceName: string;
  step: number;
  onClose: () => void;
  onSent: () => void;
};

type Preview = {
  step: number;
  subject: string;
  body: string;
  recipient: string;
  clientName: string;
  invoiceNumber: string;
};

const _STEP_LABELS = ["", "Friendly Reminder", "Second Notice", "Final Notice"];

export default function FollowUpModal({ invoiceId, invoiceName, step: _step, onClose, onSent }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}/preview-followup`)
      .then((r) => r.json())
      .then((data) => {
        setPreview(data);
        setSubject(data.subject || "");
        setBody(data.body || "");
        setLoading(false);
      });
  }, [invoiceId]);

  async function handleSend() {
    setSending(true);
    setError("");
    // Send the follow-up
    const res = await fetch(`/api/invoices/${invoiceId}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send follow-up");
      setSending(false);
      return;
    }
    onSent();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between rounded-t-2xl bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Preview Follow-Up Email</h2>
            <p className="text-sm text-gray-500 mt-0.5">Review and edit before sending to {invoiceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading preview...</div>
          ) : preview ? (
            <>
              {/* Meta info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20">To:</span>
                  <span className="font-medium text-gray-900">{preview.recipient}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20">Subject:</span>
                  <span className="text-gray-700">{preview.step === 1 ? "Friendly Reminder" : preview.step === 2 ? "Second Notice" : "Final Notice"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20">Invoice:</span>
                  <span className="text-gray-700">#{preview.invoiceNumber}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Email subject"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none whitespace-pre-wrap"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                💡 Edit the subject or message above before sending. The AI-generated draft is a starting point — customise it however you like.
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || loading}
            className="px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "✉️  Send Follow-Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
