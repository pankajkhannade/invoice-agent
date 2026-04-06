"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ParsedRow = {
  clientName: string;
  clientEmail: string;
  amount: string;
  currency: string;
  dueDate: string;
  notes: string;
  valid: boolean;
  error?: string;
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const get = (row: string[], key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };
  return lines.slice(1).map((line, _i) => {
    const cols = line.split(",");
    const clientName = get(cols, "clientname") || get(cols, "client_name") || get(cols, "name");
    const clientEmail = get(cols, "clientemail") || get(cols, "client_email") || get(cols, "email");
    const amount = get(cols, "amount");
    const currency = get(cols, "currency") || "USD";
    const dueDate = get(cols, "duedate") || get(cols, "due_date");
    const notes = get(cols, "notes") || "";

    const errors: string[] = [];
    if (!clientName) errors.push("missing clientName");
    if (!clientEmail) errors.push("missing clientEmail");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errors.push("invalid amount");
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push("dueDate must be YYYY-MM-DD");

    return {
      clientName,
      clientEmail,
      amount,
      currency,
      dueDate,
      notes,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join(", ") : undefined,
    };
  });
}

export default function BulkUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [phase, setPhase] = useState<"upload" | "preview" | "result">("upload");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: { index: number; error: string }[] } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setPhase("preview");
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    setUploading(true);
    const payload = rows
      .filter((r) => r.valid)
      .map((r) => ({
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        amount: r.amount,
        currency: r.currency,
        dueDate: r.dueDate,
        notes: r.notes,
      }));

    try {
      const res = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoices: payload }),
      });
      const data = await res.json();
      setResult(data);
      setPhase("result");
    } catch {
      setResult({ created: 0, failed: payload.length, errors: [{ index: -1, error: "Network error" }] });
      setPhase("result");
    }
    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">InvoiceAgent</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to dashboard</Link>
        </div>

        {phase === "upload" && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk CSV Upload</h1>
            <p className="text-gray-500 mb-8">Upload a CSV with columns: <code className="bg-gray-100 px-2 py-1 rounded">clientName</code>, <code className="bg-gray-100 px-2 py-1 rounded">clientEmail</code>, <code className="bg-gray-100 px-2 py-1 rounded">amount</code>, <code className="bg-gray-100 px-2 py-1 rounded">currency</code>, <code className="bg-gray-100 px-2 py-1 rounded">dueDate</code>, <code className="bg-gray-100 px-2 py-1 rounded">notes</code> (optional). Use <code>dueDate</code> as <code>YYYY-MM-DD</code>.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Choose CSV file
            </button>
          </div>
        )}

        {phase === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Preview — {rows.length} rows</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRows([]); setPhase("upload"); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Choose different file
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={uploading || rows.filter((r) => r.valid).length === 0}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {uploading ? "Uploading..." : `Create ${rows.filter((r) => r.valid).length} invoices`}
                </button>
              </div>
            </div>

            {rows.filter((r) => !r.valid).length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
                ⚠️ {rows.filter((r) => !r.valid).length} row(s) have validation errors and will be skipped
              </div>
            )}

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["#", "Client Name", "Client Email", "Amount", "Currency", "Due Date", "Notes", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, i) => (
                    <tr key={i} className={`${row.valid ? "" : "bg-red-50"}`}>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">{row.clientName || <span className="text-red-500">—</span>}</td>
                      <td className="px-4 py-3">{row.clientEmail || <span className="text-red-500">—</span>}</td>
                      <td className="px-4 py-3">{row.amount || <span className="text-red-500">—</span>}</td>
                      <td className="px-4 py-3">{row.currency}</td>
                      <td className="px-4 py-3">{row.dueDate || <span className="text-red-500">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{row.notes || "—"}</td>
                      <td className="px-4 py-3">
                        {row.valid ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Ready</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800" title={row.error}>
                            ✗ {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div className="bg-white rounded-xl border p-8">
            <div className="text-4xl mb-4 text-center">{
              result.created === rows.filter((r) => r.valid).length ? "🎉" : result.created > 0 ? "⚠️" : "❌"
            }</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Upload complete</h1>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <div className="text-3xl font-bold text-green-700">{result.created}</div>
                <div className="text-sm text-green-600 mt-1">Created</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <div className="text-3xl font-bold text-red-700">{result.failed}</div>
                <div className="text-sm text-red-600 mt-1">Failed</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold text-red-800 mb-2">Errors:</div>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((e) => (
                    <li key={e.index}>Row {e.index + 1}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                View all invoices
              </button>
              <button
                onClick={() => { setRows([]); setPhase("upload"); setResult(null); }}
                className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Upload another CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
