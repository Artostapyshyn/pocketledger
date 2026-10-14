"""Integration tests for the CSV export endpoint (issue #1)."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

_tmp = tempfile.mktemp(suffix="-csv.db")
os.environ["POCKETLEDGER_DB"] = _tmp
os.environ["POCKETLEDGER_TOKEN"] = "test-token"

import database  # noqa: E402
import main as app_module  # noqa: E402

client = TestClient(app_module.app)
AUTH = {"Authorization": "Bearer test-token"}


@pytest.fixture(autouse=True)
def fresh_db():
    database.DB_PATH = _tmp
    if os.path.exists(_tmp):
        os.remove(_tmp)
    database.init_db()
    yield
    if os.path.exists(_tmp):
        os.remove(_tmp)


def test_csv_export_empty():
    """CSV export with no transactions returns header row only."""
    resp = client.get("/transactions/export", headers=AUTH)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    lines = resp.text.strip().splitlines()
    assert lines[0] == "id,date,description,category,amount"
    assert len(lines) == 1


def test_csv_export_with_data():
    """CSV export returns one data row per transaction."""
    database.create_transaction(-25.50, "Lunch", "Food", "2024-06-01")
    database.create_transaction(1000.00, "Salary", "Income", "2024-06-01")
    resp = client.get("/transactions/export", headers=AUTH)
    assert resp.status_code == 200
    lines = resp.text.strip().splitlines()
    # header + 2 data rows
    assert len(lines) == 3
    assert "Lunch" in resp.text
    assert "Salary" in resp.text
    assert "-25.5" in resp.text


def test_csv_export_requires_auth():
    """CSV export endpoint must return 401 without a valid token."""
    resp = client.get("/transactions/export", headers={"Authorization": "Bearer wrong"})
    assert resp.status_code == 401


def test_csv_export_content_disposition():
    """CSV response must include Content-Disposition attachment header."""
    resp = client.get("/transactions/export", headers=AUTH)
    assert "attachment" in resp.headers.get("content-disposition", "")
    assert "transactions.csv" in resp.headers.get("content-disposition", "")
