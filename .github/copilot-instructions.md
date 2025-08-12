# Copilot AI Coding Agent Instructions for Credit Karma Scraper & Finance Dashboard

## Project Overview
- **Two main parts:**
  - `src/` (Python): Scrapes Credit Karma for financial data (cards, cash, investments, transactions) using browser automation and session tokens. Outputs CSV/JSON to `Data/`.
  - `finance-dashboard/` (React + Vite): Visualizes the exported data with modern analytics, charts, and AI assistant features.

## Key Workflows
- **Python Scraper:**
  - Main entry: `src/credit_karma_scraper.py` (run directly)
  - Requires a valid Credit Karma access token (see README for instructions)
  - Data is saved in `Data/` as CSV/JSON for use by the dashboard
  - Handles token expiry and can resume with a new token
- **React Dashboard:**
  - Start dev server: `cd finance-dashboard && npm install && npm run dev`
  - Reads data from `public/data/` (copy or symlink from root `Data/` if needed)
  - Main app: `src/Dashboard.jsx`, charts in `src/components/Charts.jsx`
  - Uses custom color palette and modern UI patterns

## Patterns & Conventions
- **Python:**
  - All scraping logic is modularized: `balances.py`, `transactions.py`, `browser_automation.py`, `utils.py`
  - Data is always written to `Data/` (ensure directory exists)
  - Use `save_json` and similar helpers for output
- **React:**
  - Data loading utilities in `src/utils/dataUtils.js`
  - Chart components (`LineChart`, `PieChart`, `BarChart`) in `src/components/Charts.jsx`
  - Use `getCategoryIcon` from `TransactionSearch.jsx` for category visuals
  - Prefer Tailwind/utility classes for layout and color
  - All major dashboard cards are in `src/components/`
  - Use `formatCurrency` for all currency display

## Integration Points
- **Data Flow:** Python writes to `Data/`, React reads from `public/data/` (keep in sync)
- **Category Icons:** Use `getCategoryIcon` for consistent emoji/iconography
- **Custom Chart Styling:** See `Charts.jsx` for palette and plugin setup

## Testing & Debugging
- **Python:** Run scripts directly, check `Data/` outputs
- **React:** Use Vite dev server, hot reload enabled
- **No backend server:** All data is static after scraping

## Examples
- To add a new chart: create a component in `src/components/`, use data from `dataUtils.js`, and follow the pattern in `Dashboard.jsx`
- To add a new data source: update Python scraper, export to `Data/`, and update dashboard data loading if needed

---
For more, see `README.md` in both root and `finance-dashboard/`.
