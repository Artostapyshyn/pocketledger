import { useEffect, useState, useCallback } from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import BarChart from './components/BarChart';
import Balance from './components/Balance';
import { fetchTransactions, fetchSummary, downloadCsv } from './api';
import './App.css';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (cat = selectedCategory) => {
    try {
      const [txs, sum] = await Promise.all([
        fetchTransactions(cat || null),
        fetchSummary(),
      ]);
      setTransactions(txs);
      setSummary(sum);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [selectedCategory]);

  useEffect(() => { load(); }, [load]);

  // Unique categories from summary for the filter dropdown
  const categories = summary.map((s) => s.category);

  const handleAdd = (tx) => {
    // Optimistic: reload to keep ordering and balance consistent
    load();
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    // Also reload summary
    fetchSummary().then(setSummary).catch(() => {});
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    load(cat);
  };

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <h1>💰 PocketLedger</h1>
          <button className="export-btn" onClick={downloadCsv}>Export CSV</button>
        </div>
      </header>
      <main>
        {error && <p className="error global-error">{error}</p>}
        <Balance transactions={transactions} />
        <TransactionForm onAdd={handleAdd} />
        <TransactionList
          transactions={transactions}
          onDelete={handleDelete}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        <section className="chart-section">
          <h2>Spending by Category</h2>
          <BarChart data={summary} />
        </section>
      </main>
    </div>
  );
}
