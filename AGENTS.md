# AGENTS.md — PocketLedger

This file provides guidance to AI agents (IBM Bob and others) working with the PocketLedger codebase.

## What this repo is

**PocketLedger** is a personal finance tracker with a two-service architecture:

- **`backend/`** — Python 3.11 + FastAPI + SQLite, served on port 8000 via `uvicorn`
- **`frontend/`** — React 18 + Vite, served on port 5173, proxies `/api/*` → `http://127.0.0.1:8000`

## Quick start

```bash
export POCKETLEDGER_TOKEN="dev-token-123"   # or any string
./start.sh
```

`start.sh` installs dependencies and starts both services in the background.

## Architecture

```
Browser
  └── React 18 (Vite, port 5173)
        └── /api/*  →  FastAPI (uvicorn, port 8000)
                          └── SQLite  (pocketledger.db, git-ignored)
```

### Backend — key decisions

- **Database:** `sqlite3` stdlib, no ORM. Schema: single `transactions` table.
- **Balance:** computed client-side by summing all `amount` values. No stored balance column.
- **Auth:** every endpoint requires `Authorization: Bearer <token>` where the token value comes from the `POCKETLEDGER_TOKEN` environment variable. The check is in `verify_token()` in `main.py`.
- **Monetary precision:** all amounts are stored as `REAL` (SQLite float) but are always rounded to 2 decimal places via `round(..., 2)` in `database.py` before insertion. Never use raw user input directly.
- **CSV export:** `GET /transactions/export` returns a `text/csv` stream using Python's built-in `csv` module.

### Frontend — key decisions

- The bearer token is read from the `VITE_TOKEN` environment variable (falls back to `dev-token-123` for local dev).
- All API calls go through `src/api.js`; components never fetch directly.
- The bar chart in `BarChart.jsx` uses the **Canvas API** — no external charting library.
- Vite proxy config is in `vite.config.js`: `/api/*` → `http://127.0.0.1:8000/*`.

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

All tests are in `backend/test_database.py` and test the data layer directly (no HTTP layer).

## Project-specific constraints

1. **Never commit `pocketledger.db`** — it is git-ignored and regenerated automatically on first start.
2. **Never use `float` without rounding to 2 decimal places** for monetary values — see `database.create_transaction()` as the reference.
3. **Any new API endpoint must be added to `allow_methods` in the CORS middleware** in `main.py` or the frontend will be blocked.
4. **All React components must have a JSDoc comment** describing their props — see `Balance.jsx` and `BarChart.jsx` as reference.
5. **After every Agent mode Bob interaction**, append to `bob-audit/audit.log` in the format: `[ISO timestamp] [mode] [brief description]`.

## File layout

```
pocketledger/
├── backend/
│   ├── main.py           # FastAPI app, routes, auth
│   ├── database.py       # SQLite data layer (all DB operations)
│   ├── test_database.py  # pytest unit tests (7 tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Root component, state management
│   │   ├── App.css       # All styles (plain CSS, no framework)
│   │   ├── api.js        # API client (all fetch calls)
│   │   └── components/
│   │       ├── Balance.jsx         # Live balance display
│   │       ├── TransactionForm.jsx # Add transaction form
│   │       ├── TransactionList.jsx # Table + category filter
│   │       └── BarChart.jsx        # Canvas bar chart (no library)
│   ├── vite.config.js
│   └── index.html
├── .bob/
│   ├── rules/
│   │   └── pocketledger-standards.md
│   └── custom_modes.yaml
├── bob-audit/
│   └── audit.log
├── ledger-review/
│   └── initial-review.md
├── start.sh
└── AGENTS.md             # this file
```
