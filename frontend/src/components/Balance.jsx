/**
 * Balance component — shows live balance computed from all transactions.
 *
 * @param {{ transactions: Array<{amount: number}> }} props
 *   transactions — full list of transactions used to compute the live balance.
 */
export default function Balance({ transactions }) {
  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const cls = balance >= 0 ? 'balance positive' : 'balance negative';
  return (
    <div className={cls}>
      <span className="balance-label">Current Balance</span>
      <span className="balance-amount">
        {balance >= 0 ? '+' : ''}€{balance.toFixed(2)}
      </span>
    </div>
  );
}
