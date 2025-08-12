from src.credit_karma_scraper import graphql_request, fetch_balances_cash, fetch_balances_invest, fetch_transactions, fetch_card_balances
import requests
import dotenv
import json
import json
from src.utils import (  load_from_json,
    extract_card_balances_to_csv,
    extract_cash_balances_to_csv,
    extract_investment_balances_to_csv,
    extract_investment_history_to_csv,
    extract_transactions_to_csv
)
"""
# Convenience function to extract all balance types and transactions to CSV files
"""


json_files = [
    "Data/card_balances.json",
    "Data/cash_balances.json",
    "Data/investment_balances.json",
    "Data/transactions.json"
]

def extract_all_to_csv():
    """
    Extracts all balance types and transactions from JSON files to CSV files.
    """
    print("Extracting all balances and transactions to CSV...")
    
    # Load and extract card balances
    card_data = load_from_json(json_files[0])
    extract_card_balances_to_csv(card_data, "Data/card_balances.csv")
    
    # Load and extract cash balances
    cash_data = load_from_json(json_files[1])
    extract_cash_balances_to_csv(cash_data, "Data/cash_balances.csv")
    
    # Load and extract investment balances
    investment_data = load_from_json(json_files[2])
    extract_investment_balances_to_csv(investment_data, "Data/investment_balances.csv")
    
    # Load and extract investment history
    investment_history_data = load_from_json(json_files[2])  
    extract_investment_history_to_csv(investment_history_data, "Data/investment_history.csv")
    
    # Load and extract transactions
    transactions_data = load_from_json(json_files[3])
    extract_transactions_to_csv(transactions_data, "Data/transactions.csv")
    
def main():
    print("Welcome to the Credit Karma Scraper!")
    # Prefer environment variable for initial token
    access_token = dotenv.get_key('.env', 'CK_ACCESS_TOKEN')
    
    print("[LOG] Setting up session with Authorization header...")
    session = requests.Session()
    session.headers.update({
        'Authorization': f'{access_token}',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
    })
    print(f"[LOG] Session setup complete. Using token: {session.headers['Authorization'][:12]}...{session.headers['Authorization'][-4:]}")

    # Test token validity before proceeding
    test_payload = {"query": "query { me { id } }"}
    test_resp = graphql_request(session, test_payload)
    if not test_resp or test_resp.get("errorCode") == "TOKEN_NEEDS_REFRESH":
        print("[ERROR] Initial access token is invalid or expired. Please set CK_ACCESS_TOKEN and try again.")
        return

    # # Fetch all balances
    fetch_balances_cash(session)
    fetch_balances_invest(session)
    fetch_transactions(session)
    # # Fetch card balances
    fetch_card_balances(session)
    
    extract_all_to_csv()
    print("Done!")
    print("Check the Data folder for the extracted CSV files.")

if __name__ == "__main__":
    main()