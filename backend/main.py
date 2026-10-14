"""PocketLedger FastAPI backend."""

import csv
import io
import os
from datetime import date as date_type
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

import database

app = FastAPI(title="PocketLedger API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

database.init_db()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def verify_token(authorization: str = Header(...)) -> None:
    """Validate the static bearer token from POCKETLEDGER_TOKEN env var."""
    token = os.environ.get("POCKETLEDGER_TOKEN", "dev-token-123")
    expected = f"Bearer {token}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TransactionIn(BaseModel):
    amount: float
    description: str
    category: str
    date: str

    @field_validator("amount")
    @classmethod
    def amount_two_decimals(cls, v: float) -> float:
        return round(float(v), 2)

    @field_validator("description", "category")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()

    @field_validator("date")
    @classmethod
    def valid_date(cls, v: str) -> str:
        date_type.fromisoformat(v)  # raises ValueError if invalid
        return v


class TransactionOut(BaseModel):
    id: int
    amount: float
    description: str
    category: str
    date: str


class CategoryTotal(BaseModel):
    category: str
    total: float


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/transactions", response_model=list[TransactionOut])
def get_transactions(
    category: Optional[str] = Query(None),
    _: None = Depends(verify_token),
):
    """List all transactions newest-first, optionally filtered by category."""
    return database.list_transactions(category)


@app.post("/transactions", response_model=TransactionOut, status_code=201)
def add_transaction(payload: TransactionIn, _: None = Depends(verify_token)):
    """Add a new transaction."""
    return database.create_transaction(
        payload.amount, payload.description, payload.category, payload.date
    )


@app.delete("/transactions/{transaction_id}", status_code=204)
def remove_transaction(transaction_id: int, _: None = Depends(verify_token)):
    """Delete a transaction by ID."""
    deleted = database.delete_transaction(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")


@app.get("/transactions/summary", response_model=list[CategoryTotal])
def get_summary(_: None = Depends(verify_token)):
    """Return spending totals grouped by category."""
    return database.category_totals()


@app.get("/transactions/export")
def export_csv(_: None = Depends(verify_token)):
    """Export all transactions as a CSV file."""
    transactions = database.list_transactions()
    output = io.StringIO()
    writer = csv.DictWriter(
        output, fieldnames=["id", "date", "description", "category", "amount"]
    )
    writer.writeheader()
    for t in transactions:
        writer.writerow({k: t[k] for k in ["id", "date", "description", "category", "amount"]})
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
