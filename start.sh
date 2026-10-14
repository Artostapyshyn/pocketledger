#!/usr/bin/env bash
set -e

export POCKETLEDGER_TOKEN="${POCKETLEDGER_TOKEN:-dev-token-123}"

echo "Starting PocketLedger backend on http://127.0.0.1:8000 ..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ../frontend
echo "Starting PocketLedger frontend on http://localhost:5173 ..."
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "PocketLedger is running:"
echo "  Backend:  http://127.0.0.1:8000/docs"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
