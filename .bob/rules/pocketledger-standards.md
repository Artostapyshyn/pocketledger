# PocketLedger — Bob Standards

All Python functions that handle monetary amounts must use float with exactly
2 decimal places of precision — never store raw user input directly to the DB.
Use `round(float(value), 2)` before any DB write. See `database.create_transaction()`
as the canonical reference implementation.

All React components must have a JSDoc comment describing their props.
The comment must appear before the function declaration and list every prop
the component accepts. See `Balance.jsx` and `BarChart.jsx` as reference examples.

After every Agent mode interaction, append a one-line entry to bob-audit/audit.log
in the format: [ISO timestamp] [mode] [brief description of change]
Example: `2024-06-15T10:23:00Z agent Added CSV export endpoint to main.py`
