# Credit Karma Scraper & Finance Dashboard

A comprehensive financial data extraction and visualization tool consisting of a Python scraper for Credit Karma and a modern React dashboard for data analysis.

## What It Does

This project enables you to:
- **Extract** your financial data from Credit Karma (transactions, balances, investments)
- **Visualize** your data with interactive charts and analytics
- **Analyze** spending patterns, trends, and financial health
- **Chat** with an AI assistant about your financial data

## Project Structure

```
credit-karma-scraper/
├── src/                          # Python scraper
│   ├── credit_karma_scraper.py   # Main entry point
│   ├── balances.py               # Account balance extraction
│   ├── browser_automation.py     # Browser automation utilities
│   └── utils.py                  # Data processing utilities
├── Data/                         # Scraped data output (CSV/JSON)
├── finance-dashboard/            # React dashboard
│   ├── src/
│   │   ├── Dashboard.jsx         # Main dashboard component
│   │   ├── components/           # UI components (charts, cards, etc.)
│   │   └── utils/                # Data processing utilities
│   └── public/data/              # Dashboard data source
└── requirements.txt              # Python dependencies
```

## Quick Start

### 1. Python Scraper

```bash
# Install Python dependencies
pip install -r requirements.txt
```

**Getting Your Access Token:**
1. Log into Credit Karma in your browser
2. Open Developer Tools (F12) → Network tab
3. Refresh the page and look for any API request
4. Copy the `Authorization` header value (remove "Bearer " prefix)
5. Paste when prompted by the scraper

### 2. Backend Server

```bash
# Install Python dependencies (if not already done)
pip install -r requirements.txt

# Start the backend server
uvicorn app:app --reload
```

The backend will be available at `http://localhost:8000`

### 3. React Dashboard

```bash
# Navigate to dashboard
cd finance-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Features

### Python Scraper
- ✅ Secure session token authentication
- ✅ Extracts all transaction history with pagination
- ✅ Fetches credit card, cash, and investment balances
- ✅ Exports to CSV and JSON formats

### React Dashboard
- 📊 Interactive charts (line, bar, pie)
- 💰 Financial overview cards
- 🔍 Transaction search and filtering
- 📈 Investment portfolio tracking
- 🤖 AI-powered financial assistant
- 🌙 Light/dark theme support


## AI Assistant Setup

To use the financial AI assistant:

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Add your API key to the `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

**Note:** The `.env` file should be in the project root (same level as README.md), not inside the finance-dashboard folder.

## Important Notes

- ⏱️ Access tokens expire after ~10 minutes
- 💾 The scraper saves progress and can resume with new tokens
- 🔄 Data sync: Copy scraped data to dashboard's `public/data/` folder
- 🔒 All data processing happens locally - no data sent to external servers

## Disclaimer

**This tool is for personal use only.** 

- ⚠️ Use responsibly and respect Credit Karma's Terms of Service
- 🔐 Your credentials and financial data remain on your local machine
- 📋 This project is not affiliated with or endorsed by Credit Karma
- 🏦 Always verify important financial information with official sources

By using this tool, you acknowledge that you are responsible for compliance with all applicable terms of service and local regulations.