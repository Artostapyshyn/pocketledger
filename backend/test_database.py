"""Unit tests for the PocketLedger database layer."""

import os
import tempfile
import pytest

# Point the DB to a temp file before importing database
_tmp = tempfile.mktemp(suffix=".db")
os.environ["POCKETLEDGER_DB"] = _tmp

import database  # noqa: E402 — must import after env var is set


@pytest.fixture(autouse=True)
def fresh_db():
    """Re-initialise a clean DB before each test and remove it afterward."""
    # Remove any leftover file
    if os.path.exists(_tmp):
        os.remove(_tmp)
    database.init_db()
    yield
    if os.path.exists(_tmp):
        os.remove(_tmp)


# ---------------------------------------------------------------------------
# Test 1 — create and retrieve a transaction
# ---------------------------------------------------------------------------
def test_create_transaction():
    tx = database.create_transaction(42.50, "Grocery run", "Food", "2024-06-01")
    assert tx["id"] is not None
    assert tx["amount"] == 42.50
    assert tx["description"] == "Grocery run"
    assert tx["category"] == "Food"
    assert tx["date"] == "2024-06-01"


# ---------------------------------------------------------------------------
# Test 2 — list returns newest first
# ---------------------------------------------------------------------------
def test_list_transactions_order():
    database.create_transaction(10.00, "Old", "Other", "2024-01-01")
    database.create_transaction(20.00, "New", "Other", "2024-06-15")
    rows = database.list_transactions()
    assert len(rows) == 2
    assert rows[0]["date"] == "2024-06-15"
    assert rows[1]["date"] == "2024-01-01"


# ---------------------------------------------------------------------------
# Test 3 — filter by category
# ---------------------------------------------------------------------------
def test_list_transactions_filter():
    database.create_transaction(5.00, "Coffee", "Food", "2024-05-01")
    database.create_transaction(100.00, "Rent", "Housing", "2024-05-01")
    food = database.list_transactions(category="Food")
    assert len(food) == 1
    assert food[0]["category"] == "Food"


# ---------------------------------------------------------------------------
# Test 4 — delete removes the row
# ---------------------------------------------------------------------------
def test_delete_transaction():
    tx = database.create_transaction(15.00, "Book", "Education", "2024-04-01")
    result = database.delete_transaction(tx["id"])
    assert result is True
    remaining = database.list_transactions()
    assert all(r["id"] != tx["id"] for r in remaining)


# ---------------------------------------------------------------------------
# Test 5 — delete non-existent returns False
# ---------------------------------------------------------------------------
def test_delete_nonexistent():
    result = database.delete_transaction(99999)
    assert result is False


# ---------------------------------------------------------------------------
# Test 6 — category totals aggregation
# ---------------------------------------------------------------------------
def test_category_totals():
    database.create_transaction(30.00, "Lunch", "Food", "2024-05-10")
    database.create_transaction(20.00, "Dinner", "Food", "2024-05-11")
    database.create_transaction(50.00, "Bus pass", "Transport", "2024-05-12")
    totals = database.category_totals()
    totals_map = {t["category"]: t["total"] for t in totals}
    assert totals_map["Food"] == 50.00
    assert totals_map["Transport"] == 50.00


# ---------------------------------------------------------------------------
# Test 7 — amount is rounded to 2 decimal places
# ---------------------------------------------------------------------------
def test_amount_precision():
    tx = database.create_transaction(9.999, "Rounding test", "Other", "2024-03-01")
    assert tx["amount"] == 10.00
