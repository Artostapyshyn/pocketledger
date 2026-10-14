/**
 * api.js — Thin API client for PocketLedger backend.
 * All requests inject the Authorization header from VITE_TOKEN env var (falls back to dev-token-123).
 */

const TOKEN = import.meta.env.VITE_TOKEN ?? 'dev-token-123';
const BASE = '/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
});

/**
 * Fetch all transactions, optionally filtered by category.
 * @param {string|null} category
 * @returns {Promise<Array>}
 */
export async function fetchTransactions(category = null) {
  const url = category ? `${BASE}/transactions?category=${encodeURIComponent(category)}` : `${BASE}/transactions`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  return res.json();
}

/**
 * Add a new transaction.
 * @param {{ amount: number, description: string, category: string, date: string }} payload
 * @returns {Promise<Object>}
 */
export async function addTransaction(payload) {
  const res = await fetch(`${BASE}/transactions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Failed to add transaction: ${res.status}`);
  }
  return res.json();
}

/**
 * Delete a transaction by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteTransaction(id) {
  const res = await fetch(`${BASE}/transactions/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to delete transaction: ${res.status}`);
}

/**
 * Fetch category spending summary.
 * @returns {Promise<Array<{category: string, total: number}>>}
 */
export async function fetchSummary() {
  const res = await fetch(`${BASE}/transactions/summary`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);
  return res.json();
}

/**
 * Download all transactions as a CSV file.
 * @returns {Promise<void>}
 */
export async function downloadCsv() {
  const res = await fetch(`${BASE}/transactions/export`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to export CSV: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}
