/**
 * TransactionForm component — lets users add a new transaction.
 *
 * @param {{ onAdd: (tx: Object) => void }} props
 *   onAdd — callback invoked with the newly created transaction object.
 */
import { useState } from 'react';
import { addTransaction } from '../api';

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Health', 'Education', 'Entertainment', 'Other'];

export default function TransactionForm({ onAdd }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ amount: '', description: '', category: 'Food', date: today });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError('Amount must be a number.');
      return;
    }
    setLoading(true);
    try {
      const tx = await addTransaction({ ...form, amount: parseFloat(form.amount) });
      onAdd(tx);
      setForm({ amount: '', description: '', category: 'Food', date: today });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="tx-form" onSubmit={submit}>
      <h2>Add Transaction</h2>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
        <input
          type="number"
          name="amount"
          placeholder="Amount (negative = expense)"
          value={form.amount}
          onChange={handle}
          step="0.01"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handle}
          required
        />
        <select name="category" value={form.category} onChange={handle}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" name="date" value={form.date} onChange={handle} required />
        <button type="submit" disabled={loading}>{loading ? '...' : 'Add'}</button>
      </div>
    </form>
  );
}
