/**
 * TransactionList component — displays transactions in a table with delete buttons.
 *
 * @param {{
 *   transactions: Array<{id: number, date: string, description: string, category: string, amount: number}>,
 *   onDelete: (id: number) => void,
 *   categories: string[],
 *   selectedCategory: string,
 *   onCategoryChange: (cat: string) => void
 * }} props
 */
import { deleteTransaction } from '../api';
import { useState } from 'react';

export default function TransactionList({ transactions, onDelete, categories, selectedCategory, onCategoryChange }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteTransaction(id);
      onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="tx-list">
      <div className="list-header">
        <h2>Transactions</h2>
        <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {transactions.length === 0 ? (
        <p className="muted">No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="right">Amount (€)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className={tx.amount >= 0 ? 'income' : 'expense'}>
                <td>{tx.date}</td>
                <td>{tx.description}</td>
                <td>{tx.category}</td>
                <td className="right">{tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}</td>
                <td>
                  <button
                    className="del-btn"
                    onClick={() => handleDelete(tx.id)}
                    disabled={deleting === tx.id}
                  >
                    {deleting === tx.id ? '…' : '✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
