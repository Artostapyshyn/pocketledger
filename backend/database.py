"""Database layer for PocketLedger — SQLite via sqlite3."""

import sqlite3
import os
from pathlib import Path

DB_PATH = os.environ.get("POCKETLEDGER_DB", str(Path(__file__).parent / "pocketledger.db"))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the transactions table if it does not exist."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                amount    REAL    NOT NULL,
                description TEXT  NOT NULL,
                category  TEXT    NOT NULL,
                date      TEXT    NOT NULL
            )
            """
        )
        conn.commit()


# ---------------------------------------------------------------------------
# Data-layer helpers
# ---------------------------------------------------------------------------

def create_transaction(amount: float, description: str, category: str, date: str) -> dict:
    """Insert a new transaction and return the created row."""
    amount = round(float(amount), 2)
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO transactions (amount, description, category, date) VALUES (?, ?, ?, ?)",
            (amount, description, category, date),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM transactions WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def list_transactions(category: str | None = None) -> list[dict]:
    """Return all transactions ordered newest-first, optionally filtered by category."""
    with get_connection() as conn:
        if category:
            rows = conn.execute(
                "SELECT * FROM transactions WHERE category = ? ORDER BY date DESC, id DESC",
                (category,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM transactions ORDER BY date DESC, id DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def delete_transaction(transaction_id: int) -> bool:
    """Delete a transaction by ID. Returns True if a row was deleted."""
    with get_connection() as conn:
        cur = conn.execute(
            "DELETE FROM transactions WHERE id = ?", (transaction_id,)
        )
        conn.commit()
        return cur.rowcount > 0


def category_totals() -> list[dict]:
    """Return aggregated totals per category."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT category, ROUND(SUM(amount), 2) as total FROM transactions GROUP BY category ORDER BY category"
        ).fetchall()
        return [dict(r) for r in rows]
