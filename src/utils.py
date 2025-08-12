def save_to_csv(data, filename):
    import pandas as pd
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)

def save_to_json(data, filename):
    import json
    with open(filename, 'w') as json_file:
        json.dump(data, json_file)

def load_from_json(filename):
    import json
    with open(filename, 'r') as json_file:
        return json.load(json_file)

def format_currency(value):
    return "${:,.2f}".format(value)

def extract_data(data, keys):
    return [{key: item[key] for key in keys} for item in data]

def extract_card_balances_to_csv(card_balances_json, output_csv="card_balances.csv"):
    """
    Extracts credit card balance information from card_balances.json
    using structural analysis instead of name matching.
    """
    import csv
    import re
    
    cards = []
    processed_account_ids = set()  # To avoid duplicates
    
    def recursively_find_texts_and_images(obj, texts=None, images=None):
        """Recursively find all text and image data in nested structure"""
        if texts is None:
            texts = []
        if images is None:
            images = []
            
        if isinstance(obj, dict):
            # Look for formatted text
            if obj.get("__typename") == "FabricComposableFormattedText":
                text_model = obj.get("composableFormattedTextModel", {})
                spans = text_model.get("spans", [])
                for span in spans:
                    text = span.get("text", "").strip()
                    if text:
                        texts.append(text)
            
            # Look for images
            elif obj.get("__typename") == "FabricComposableImage":
                image_model = obj.get("composableImageModel", {})
                image_url = image_model.get("imageUrl", "")
                # Only capture card images (not warning icons)
                if image_url and "ck-content.imgix.net" in image_url:
                    images.append(image_url)
            
            # Recurse into all values
            for value in obj.values():
                recursively_find_texts_and_images(value, texts, images)
                
        elif isinstance(obj, list):
            # Recurse into all items
            for item in obj:
                recursively_find_texts_and_images(item, texts, images)
        
        return texts, images
    
    try:
        # Navigate to the content array
        content = card_balances_json.get("data", {}).get("myWalletInsights", {}).get("getMyWalletInsight", {}).get("content", [])
        
        # Extract individual cards using structural identifiers
        for item in content:
            composable_root = item.get("item", {}).get("composableRoot", {})
            if not composable_root:
                continue
                
            # Check if this is a card row by looking for the tracking identifier
            fabric_metadata = composable_root.get("fabricMetadata", [])
            is_card_row = False
            for metadata in fabric_metadata:
                tracking_id = metadata.get("fabricTrackingIdentifier", "")
                if "snipes/bookmark/presets/row/spindle/view" in tracking_id:
                    is_card_row = True
                    break
            
            if not is_card_row:
                continue
            
            # Extract account ID from destination (search recursively)
            account_id = None
            def find_account_id(obj):
                if isinstance(obj, dict):
                    # Direct check for account ID
                    if "accountId" in obj:
                        return obj["accountId"]
                    # Check destination body
                    destination_body = obj.get("destinationBody", {})
                    if destination_body and "accountId" in destination_body:
                        return destination_body["accountId"]
                    # Recurse
                    for value in obj.values():
                        result = find_account_id(value)
                        if result:
                            return result
                elif isinstance(obj, list):
                    for item in obj:
                        result = find_account_id(item)
                        if result:
                            return result
                return None
            
            account_id = find_account_id(composable_root)
            
            # Skip if we've already processed this account
            if account_id and account_id in processed_account_ids:
                continue
            
            # Extract all text and images from this card section recursively
            all_texts, card_images = recursively_find_texts_and_images(composable_root)
            
            # Extract card data from this structured section
            card_data = {
                "account_id": account_id or "",
                "card_name": "",
                "balance": "",
                "credit_usage": "",
                "last_updated": "",
                "card_type": "Credit Card",
                "image_url": card_images[0] if card_images else ""
            }
            
            # Parse the extracted texts to identify data types
            for text in all_texts:
                # Balance detection (starts with $ or -$ and has numbers)
                if (text.startswith("$") or text.startswith("-$")) and re.search(r'-?\$[\d,]+', text):
                    if not card_data["balance"]:  # Take the first balance found
                        balance_match = re.search(r'-?\$[\d,]+', text)
                        if balance_match:
                            card_data["balance"] = balance_match.group()
                
                # Credit usage detection
                elif "credit usage" in text.lower() or text.endswith("% credit usage"):
                    usage_match = re.search(r'(\d+)%', text)
                    if usage_match:
                        card_data["credit_usage"] = usage_match.group()
                
                # Date detection
                elif text.lower() in ["today", "yesterday"]:
                    card_data["last_updated"] = text
                
                # Card name detection (anything else that's substantial and not the above)
                elif (len(text) > 5 and 
                      not text.startswith("$") and 
                      not re.search(r'\d+%\s*credit usage', text.lower()) and  # Exclude credit usage strings
                      "see details" not in text.lower() and
                      text.lower() not in ["today", "yesterday"]):
                    if not card_data["card_name"]:  # Take the first substantial text as card name
                        card_data["card_name"] = text
            
            # Only add cards that have at least a name or account ID
            if (card_data["card_name"] or card_data["account_id"]) and account_id:
                cards.append(card_data)
                processed_account_ids.add(account_id)
        
        # Write to CSV
        if cards:
            fieldnames = ["account_id", "card_name", "balance", "credit_usage", "last_updated", "card_type", "image_url"]
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(cards)
            
            print(f"[SUCCESS] Extracted {len(cards)} card records to {output_csv}")
            
            # Print summary
            for card in cards:
                print(f"  - {card['account_id']}: {card['card_name']} | {card['balance']} ({card['credit_usage']}) - {card['image_url']}")
        else:
            print("[ERROR] No card data found in the JSON")
    
    except Exception as e:
        print(f"[ERROR] Failed to extract card balances: {e}")


def extract_cash_balances_to_csv(cash_balances_json, output_csv="cash_balances.csv"):
    """
    Extracts basic cash balance information from cash_balances.json object and saves to CSV.
    Simple extraction focusing on the key data points.
    """
    import csv
    
    try:
        accounts = []
        
        # Navigate to the cards array
        cards = cash_balances_json.get("data", {}).get("prime", {}).get("networthByAccountType", {}).get("cards", [])
        
        for card in cards:
            item = card.get("item", {})
            
            # Skip the header section - we only want actual accounts
            
            # Look for individual account rows
            views = item.get("views", [])
            for view in views:
                if view.get("__typename") == "KPLRowView":
                    account_name = ""
                    balance = ""
                    bank_info = ""
                    image_url = ""
                    
                    # Extract account name from row title
                    row_title = view.get("rowTitle", {}).get("spans", [])
                    for span in row_title:
                        text = span.get("text", "").strip()
                        if text:
                            account_name = text
                            break
                    
                    # Extract balance from row value
                    row_value = view.get("rowValue", {}).get("spans", [])
                    for span in row_value:
                        text = span.get("text", "").strip()
                        if text.startswith("$") or text.startswith("-$"):
                            balance = text
                            break
                    
                    # Extract bank info from status dot
                    status_dot = view.get("rowStatusDot", {})
                    if status_dot:
                        status_spans = status_dot.get("statusDotText", {}).get("spans", [])
                        for span in status_spans:
                            text = span.get("text", "").strip()
                            if text:
                                bank_info = text
                                break
                    
                    # Extract image URL
                    row_image = view.get("rowPrimaryImage", {})
                    if row_image:
                        image_url = row_image.get("imageUrl", "")
                    
                    # Parse bank info (format: "Chase (...0172)\n4 hr ago")
                    bank_name = ""
                    account_number = ""
                    last_updated = ""
                    
                    if bank_info:
                        lines = bank_info.split('\n')
                        if len(lines) >= 1:
                            bank_line = lines[0].strip()
                            if '(' in bank_line and ')' in bank_line:
                                bank_name = bank_line.split('(')[0].strip()
                                account_part = bank_line.split('(')[1].split(')')[0]
                                account_number = account_part
                        if len(lines) >= 2:
                            last_updated = lines[1].strip()
                    
                    # Only add if we have the essential data
                    if account_name and balance:
                        accounts.append({
                            "account_name": account_name,
                            "balance": balance,
                            "bank": bank_name,
                            "account_number": account_number,
                            "last_updated": last_updated,
                            "image_url": image_url
                        })
        
        # Write to CSV
        if accounts:
            fieldnames = ["account_name", "balance", "bank", "account_number", "last_updated", "image_url"]
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(accounts)
            
            print(f"[SUCCESS] Extracted {len(accounts)} cash account records to {output_csv}")
            
            for account in accounts:
                print(f"  - {account['account_name']}: {account['balance']} | Bank: {account['bank']} | Account: {account['account_number']} | Updated: {account['last_updated']}")
        else:
            print("[ERROR] No cash account data found in the JSON")
    
    except Exception as e:
        print(f"[ERROR] Failed to extract cash balances: {e}")


def extract_investment_balances_to_csv(investment_balances_json, output_csv="investment_balances.csv"):
    """
    Extracts basic investment balance information from investment_balances.json object and saves to CSV.
    Simple extraction focusing on individual accounts with date history.
    """
    import csv
    
    try:
        accounts = []
        
        # Navigate to the cards array
        cards = investment_balances_json.get("data", {}).get("prime", {}).get("networthByAccountType", {}).get("cards", [])
        
        for card in cards:
            item = card.get("item", {})
            
            # Skip the header section - we only want actual accounts
            
            # Look for individual account rows
            views = item.get("views", [])
            for view in views:
                if view.get("__typename") == "KPLRowView":
                    account_name = ""
                    balance = ""
                    broker_info = ""
                    image_url = ""
                    
                    # Extract account name from row title
                    row_title = view.get("rowTitle", {}).get("spans", [])
                    for span in row_title:
                        text = span.get("text", "").strip()
                        if text:
                            account_name = text
                            break
                    
                    # Extract balance from row value
                    row_value = view.get("rowValue", {}).get("spans", [])
                    for span in row_value:
                        text = span.get("text", "").strip()
                        if text.startswith("$") or text.startswith("-$"):
                            balance = text
                            break
                    
                    # Extract broker info from status dot
                    status_dot = view.get("rowStatusDot", {})
                    if status_dot:
                        status_spans = status_dot.get("statusDotText", {}).get("spans", [])
                        for span in status_spans:
                            text = span.get("text", "").strip()
                            if text:
                                broker_info = text
                                break
                    
                    # Extract image URL
                    row_image = view.get("rowPrimaryImage", {})
                    if row_image:
                        image_url = row_image.get("imageUrl", "")
                    
                    # Parse broker info (format: "Robinhood (...3105)\n4 hr ago")
                    broker_name = ""
                    account_number = ""
                    last_updated = ""
                    
                    if broker_info:
                        lines = broker_info.split('\n')
                        if len(lines) >= 1:
                            broker_line = lines[0].strip()
                            if '(' in broker_line and ')' in broker_line:
                                broker_name = broker_line.split('(')[0].strip()
                                account_part = broker_line.split('(')[1].split(')')[0]
                                account_number = account_part
                        if len(lines) >= 2:
                            last_updated = lines[1].strip()
                    
                    # Only add if we have the essential data
                    if account_name and balance:
                        accounts.append({
                            "account_name": account_name,
                            "balance": balance,
                            "broker": broker_name,
                            "account_number": account_number,
                            "last_updated": last_updated,
                            "image_url": image_url
                        })
        
        # Write to CSV
        if accounts:
            fieldnames = ["account_name", "balance", "broker", "account_number", "last_updated", "image_url"]
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(accounts)
            
            print(f"[SUCCESS] Extracted {len(accounts)} investment account records to {output_csv}")
            
            for account in accounts:
                print(f"  - {account['account_name']}: {account['balance']} | Broker: {account['broker']} | Account: {account['account_number']} | Updated: {account['last_updated']}")
        else:
            print("[ERROR] No investment account data found in the JSON")
    
    except Exception as e:
        print(f"[ERROR] Failed to extract investment balances: {e}")


def extract_investment_history_to_csv(investment_balances_json, output_csv="investment_history.csv"):
    """
    Extracts historical investment data (dates and values) from investment_balances.json object and saves to CSV.
    Each row represents a data point with date and value for tracking investment performance over time.
    """
    import csv
    
    try:
        history_data = []
        
        # Navigate to the cards array
        cards = investment_balances_json.get("data", {}).get("prime", {}).get("networthByAccountType", {}).get("cards", [])
        
        for card in cards:
            item = card.get("item", {})
            views = item.get("views", [])
            
            for view in views:
                # Look for data visualization groups (charts/graphs)
                if view.get("__typename") == "FabricDataVisualizationGroup":
                    data_sets = view.get("dataVisualizationGroupDataSets", [])
                    
                    for data_set in data_sets:
                        data_set_key = data_set.get("dataSetKey", "")
                        visualization_data = data_set.get("dataVisualizationDataSet", {})
                        lines = visualization_data.get("lines", [])
                        
                        for line in lines:
                            points = line.get("points", [])
                            
                            for point in points:
                                # Extract date from xValueLabel
                                date = ""
                                x_label = point.get("xValueLabel", {})
                                if x_label:
                                    x_spans = x_label.get("spans", [])
                                    for span in x_spans:
                                        text = span.get("text", "").strip()
                                        if text:
                                            date = text
                                            break
                                
                                # Extract value from yValueLabel
                                value = ""
                                y_label = point.get("yValueLabel", {})
                                if y_label:
                                    y_spans = y_label.get("spans", [])
                                    for span in y_spans:
                                        text = span.get("text", "").strip()
                                        if text and text.startswith("$"):
                                            value = text
                                            break
                                
                                # Get raw numeric value as well
                                raw_value = point.get("yValue", "")
                                
                                # Only add if we have both date and value
                                if date and value:
                                    history_data.append({
                                        "date": date,
                                        "value": value,
                                        "raw_value": raw_value,
                                        "period": data_set_key,
                                        "data_point_index": point.get("xValue", "")
                                    })
        
        # Write to CSV
        if history_data:
            fieldnames = ["date", "value", "raw_value", "period", "data_point_index"]
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(history_data)
            
            print(f"[SUCCESS] Extracted {len(history_data)} investment history records to {output_csv}")
            
            # Show first few and last few entries
            print(f"  First entries:")
            for i, record in enumerate(history_data[:3]):
                print(f"    {record['date']}: {record['value']} (raw: {record['raw_value']})")
            
            if len(history_data) > 6:
                print(f"  ...")
                print(f"  Last entries:")
                for record in history_data[-3:]:
                    print(f"    {record['date']}: {record['value']} (raw: {record['raw_value']})")
        else:
            print("[ERROR] No investment history data found in the JSON")
    
    except Exception as e:
        print(f"[ERROR] Failed to extract investment history: {e}")


def extract_transactions_to_csv(transactions_json, output_csv="transactions.csv"):
    """
    Extracts transaction data from transactions.json and saves to CSV.
    Simple extraction of all transaction fields including account, category, and merchant info.
    """
    import csv
    
    try:
        transactions = []
        
        # Process each transaction
        for transaction in transactions_json:
            # Extract basic transaction info
            transaction_id = transaction.get("id", "")
            date = transaction.get("date", "")
            description = transaction.get("description", "")
            status = transaction.get("status", "")
            
            # Extract amount info
            amount_info = transaction.get("amount", {})
            amount_value = amount_info.get("value", "")
            amount_currency = amount_info.get("asCurrencyString", "")
            
            # Extract account info
            account_info = transaction.get("account", {})
            account_name = account_info.get("name", "")
            account_type = account_info.get("type", "")
            account_provider = account_info.get("providerName", "")
            account_display = account_info.get("accountTypeAndNumberDisplay", "")
            
            # Extract category info
            category_info = transaction.get("category", {})
            category_name = category_info.get("name", "")
            category_type = category_info.get("type", "")
            category_id = category_info.get("id", "")
            
            # Extract merchant info
            merchant_info = transaction.get("merchant")
            merchant_name = ""
            if merchant_info:
                merchant_name = merchant_info.get("name", "")
            
            # Add transaction data
            transactions.append({
                "transaction_id": transaction_id,
                "date": date,
                "description": description,
                "status": status,
                "amount_value": amount_value,
                "amount_currency": amount_currency,
                "account_name": account_name,
                "account_type": account_type,
                "account_provider": account_provider,
                "account_display": account_display,
                "category_name": category_name,
                "category_type": category_type,
                "category_id": category_id,
                "merchant_name": merchant_name
            })
        
        # Write to CSV
        if transactions:
            fieldnames = [
                "transaction_id", "date", "description", "status", 
                "amount_value", "amount_currency", 
                "account_name", "account_type", "account_provider", "account_display",
                "category_name", "category_type", "category_id", 
                "merchant_name"
            ]
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(transactions)
            
            print(f"[SUCCESS] Extracted {len(transactions)} transaction records to {output_csv}")
            
            # Show summary statistics
            total_amount = sum(t["amount_value"] for t in transactions if isinstance(t["amount_value"], (int, float)))
            expenses = sum(t["amount_value"] for t in transactions if isinstance(t["amount_value"], (int, float)) and t["amount_value"] < 0)
            income = sum(t["amount_value"] for t in transactions if isinstance(t["amount_value"], (int, float)) and t["amount_value"] > 0)
            
            print(f"  Transaction Summary:")
            print(f"    Total Amount: ${total_amount:,.2f}")
            print(f"    Total Expenses: ${abs(expenses):,.2f}")
            print(f"    Total Income: ${income:,.2f}")
            
            # Show first few transactions
            print(f"  First few transactions:")
            for i, transaction in enumerate(transactions[:3]):
                print(f"    {transaction['date']}: {transaction['description'][:30]}... | {transaction['amount_currency']} | {transaction['account_name']}")
        else:
            print("[ERROR] No transaction data found in the JSON")
    
    except Exception as e:
        print(f"[ERROR] Failed to extract transactions: {e}")

