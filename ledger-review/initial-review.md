# PocketLedger — Initial Security & Quality Review

**Mode:** Ledger Reviewer (read + mcp only)
**Date:** 2024-06-15
**Reviewer:** IBM Bob (ledger-reviewer mode)
**Scope:** Full codebase review of PocketLedger v1.0

---

## Executive Summary

The codebase is well-structured for a personal finance tracker. Auth is correctly delegated to an environment variable, monetary precision is enforced at the data-layer boundary, and input validation is handled by Pydantic on the API layer. Three low-severity and one informational finding are noted below.

---

## Findings

### FIND-001 — Category not constrained to an allow-list (Low)

**File:** `backend/main.py`, `TransactionIn` schema  
**Description:** The `category` field accepts any non-empty string. While this is fine for flexibility, it means the bar chart and filter dropdown could be polluted by arbitrary category values. There is no server-side enum or allow-list constraining the accepted values.  
**Recommendation:** Either add a `Literal[...]` type annotation or a Pydantic validator that checks against a known set. Frontend already uses a fixed dropdown, so mismatched values would only arise from direct API calls.  
**Risk:** Low — no injection risk with SQLite parameterised queries, but data quality concern.

---

### FIND-002 — Dev token fallback visible in production path (Informational)

**File:** `backend/main.py`, line ~33  
```python
token = os.environ.get("POCKETLEDGER_TOKEN", "dev-token-123")
```
**Description:** The fallback `"dev-token-123"` means the API is not locked down if the environment variable is absent in a deployed environment. This is acceptable for a development/demo context but would be a misconfiguration risk in production.  
**Recommendation:** In a production deployment, replace the fallback with `os.environ["POCKETLEDGER_TOKEN"]` (no default) so a missing env var causes an explicit startup failure rather than silently using a weak token.  
**Risk:** Informational — acceptable for workshop/demo use.

---

### FIND-003 — Amount range is unconstrained (Low)

**File:** `backend/main.py`, `TransactionIn.amount`  
**Description:** The `amount` field accepts any float, including extremely large values or zero. There is no guard against `amount=0` or `amount=1e15`.  
**Recommendation:** Add a validator: `if v == 0: raise ValueError("Amount must be non-zero")` and optionally clamp to a reasonable range (e.g. ±1,000,000).  
**Risk:** Low — no security impact, but enables nonsense data.

---

### FIND-004 — CORS `allow_origins=["*"]` (Low)

**File:** `backend/main.py`, CORSMiddleware configuration  
**Description:** The API allows requests from any origin. For a personal finance app with a static bearer token, this is a low risk (the token is still required), but it is worth noting.  
**Recommendation:** In production, restrict `allow_origins` to the specific frontend origin (e.g. `["http://localhost:5173"]`).  
**Risk:** Low — mitigated by bearer token requirement on all endpoints.

---

## Positive Observations

- ✅ All endpoints require `Authorization: Bearer <token>` — no public endpoints.
- ✅ Bearer token is read from `POCKETLEDGER_TOKEN` env var, not hardcoded.
- ✅ All monetary amounts are rounded to 2 decimal places via `round(float(v), 2)` before DB writes.
- ✅ All React components have JSDoc comments describing their props.
- ✅ Date fields are validated as ISO-8601 via `date_type.fromisoformat(v)`.
- ✅ SQLite queries use parameterised statements — no SQL injection risk.
- ✅ Canvas bar chart uses no external charting library.

---

## Summary Table

| ID | Severity | Area | Status |
|----|----------|------|--------|
| FIND-001 | Low | Input Validation | Open |
| FIND-002 | Info | Hardcoded Secrets | Open |
| FIND-003 | Low | Input Validation | Open |
| FIND-004 | Low | CORS | Open |
