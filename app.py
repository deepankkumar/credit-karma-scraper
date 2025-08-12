import subprocess
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import csv

from fastapi import Request
import dotenv

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_DIR = Path(__file__).parent / 'Data'

# Endpoint to trigger KarmaSracper.py for refresh
@app.post("/api/refresh")
def refresh_data():
    try:
        # Use sys.executable to ensure correct Python
        result = subprocess.run([sys.executable, "KarmaSracper.py"], capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Scraper failed: {result.stderr}")
        return {"status": "success", "output": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint to set CK_ACCESS_TOKEN in .env
@app.post("/api/set-token")
async def set_token(request: Request):
    data = await request.json()
    token = data.get("token")
    if not token or not isinstance(token, str):
        raise HTTPException(status_code=400, detail="Missing or invalid token.")
    try:
        dotenv.set_key('.env', 'CK_ACCESS_TOKEN', token)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update token: {e}")


# Helper to read CSV and return list of dicts
def read_csv(filename):
    file_path = DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File {filename} not found")
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        return list(reader)

@app.get("/api/transactions")
def get_transactions():
    try:
        return read_csv('transactions.csv')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/card_balances")
def get_card_balances():
    try:
        return read_csv('card_balances.csv')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cash_balances")
def get_cash_balances():
    try:
        return read_csv('cash_balances.csv')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investment_balances")
def get_investment_balances():
    try:
        return read_csv('investment_balances.csv')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investment_history")
def get_investment_history():
    try:
        return read_csv('investment_history.csv')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
