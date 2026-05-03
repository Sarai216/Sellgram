# Sellgram – Telegram Bot for Selling Digital Products (PDFs & Courses)

Sellgram is an automated platform that helps Iraqi creators and students sell **PDF summaries**, **digital courses**, and **Telegram group access** directly through a Telegram bot – with automatic delivery after payment.  
It includes a **dashboard** for sellers to manage products, view orders, and track revenue.

**No manual work** – once a payment is confirmed (simulated or real FIB), the product is sent instantly.

---

## ✨ Features

- 🤖 **Telegram bot** – customers browse products, buy, and receive files/links automatically.
- 📊 **Dashboard** – add/edit/delete products, see orders, view stats (revenue, total sales).
- 📄 **PDF delivery** – upload PDF files via dashboard → sent instantly after payment.
- 🔗 **Course delivery** – store Telegram invite links → buyer receives the link after purchase.
- 💰 **Payment simulation** – manual seller approval (no real FIB sandbox needed for now).
- 🧾 **Order tracking** – status changes: `pending` → `paid` → `delivered`.
- 🛡️ **Secure** – environment variables for tokens, database credentials never exposed.

---

## 🧱 Tech Stack

- **Backend**: Python, Flask, MySQL
- **Bot**: `python-telegram-bot` v20.7
- **Database**: MySQL (or MariaDB)
- **Frontend**: HTML, CSS, JavaScript (pure, no framework)
- **Deployment**: any Python host (Railway, Render, PythonAnywhere, VPS)

---

## 📁 Project Structure
sellgram/
├── app.py # Flask API + dashboard server
├── bot.py # Telegram bot handlers
├── db.py # MySQL connection helper
├── delivery.py # Auto‑delivery logic (PDF or link)
├── fib.py # FIB payment integration (ready for sandbox)
├── main.py # Runs Flask + bot together
├── requirements.txt
├── .env.example # copy to .env and fill
├── mysql_setup.sql # database schema
├── index.html # dashboard frontend
├── css/ # styles
├── js/ # frontend JS files
└── README.md

text

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- Python 3.8+
- MySQL server running locally or remotely
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- (Optional) ngrok or tunnel for webhooks (only if you use real FIB)

### 2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/sellgram.git
cd sellgram
pip install -r requirements.txt
3. Set up Database
Run the SQL script to create tables:

bash
mysql -u root -p < mysql_setup.sql
Or manually execute the SQL statements in your MySQL client.

4. Configure Environment
Copy .env.example to .env (or create .env manually):

env
TELEGRAM_TOKEN=your_bot_token_here
BOT_USERNAME=YourBotUsername
ADMIN_TELEGRAM_ID=your_telegram_user_id

MYSQL_HOST=localhost
MYSQL_DATABASE=sellgram
MYSQL_USERNAME=root
MYSQL_PASSWORD=yourpassword

# FIB settings (not required for simulation)
FIB_BASE_URL=https://fib.iq/openapi
FIB_CLIENT_ID=
FIB_CLIENT_SECRET=
WEBHOOK_BASE_URL=https://yourdomain.com
Important: Never commit .env to GitHub. The .gitignore already excludes it.

5. Run the System
The easiest way is to run both Flask and bot together:

bash
python main.py
Dashboard: http://localhost:5000

Telegram bot responds to /start

Alternatively, run them separately for debugging:

bash
# Terminal 1
python app.py

# Terminal 2
python bot.py
🧪 How to Use (Simulation Mode)
Since we don't have a FIB sandbox yet, the flow is:

Customer opens your bot → chooses a product → clicks "شراء".

Bot creates an order with status pending.

Customer clicks "✅ دفعت – أبلغ البائع".

Seller receives a Telegram message with Approve / Reject buttons.

Seller clicks ✅ تأكيد الدفع.

The product (PDF or course link) is delivered automatically to the customer.

Order status becomes delivered.

All of this happens without any manual file sending.

📦 Adding a Product
Via the dashboard (http://localhost:5000):

Go to منتجاتي → + إضافة منتج.

Choose type:

PDF – upload a file (it will be sent as a Telegram document).

كورس (مجموعة) – enter a Telegram invite link (e.g., https://t.me/+xxxxx).

Set name, price (in IQD).

Click إضافة المنتج.

The product now appears in your bot.

You can also use the API directly (see below).

📡 API Endpoints
All endpoints are relative to http://localhost:5000 (or your deployed URL).

Method	Endpoint	Description
GET	/api/products	List all products
POST	/api/products	Add a product (JSON)
PUT	/api/products/<id>	Update product
DELETE	/api/products/<id>	Delete product
GET	/api/orders	List all orders
GET	/api/stats	Dashboard statistics
POST	/api/upload	Upload PDF to Telegram (returns file_id)
POST	/webhook/fib	FIB payment callback (simulated for now)
Example: Add a product via curl
bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": 1,
    "name": "كورس بايثون",
    "price": 15000,
    "type": "course",
    "file_path": "https://t.me/+abc123"
  }'
🛠️ Deployment to Production
Option: Railway (recommended)
Push your code to GitHub.

Create a new project on Railway → Deploy from GitHub.

Set environment variables (all keys from .env) in Railway dashboard.

Add a MySQL database plugin or use external DB.

Railway will automatically run python main.py.

Option: VPS (Ubuntu)
Install Python, MySQL, git.

Clone the repository.

Install dependencies.

Run with nohup python main.py & or use systemd.

Important for Production
Use a real MySQL database (not local).

Change debug=False in app.run().

Set up a reverse proxy (Nginx) if needed.

For real FIB integration, enable webhooks (requires public HTTPS URL).

🔄 Switching to Real FIB Payment
When FIB provides a sandbox:

Get CLIENT_ID and CLIENT_SECRET from FIB.

Set FIB_BASE_URL, FIB_CLIENT_ID, FIB_CLIENT_SECRET in .env.

Set WEBHOOK_BASE_URL to your public URL (e.g., https://yourdomain.com).

Modify bot.py – replace the manual approval with actual FIB payment creation (see fib.create_payment).

Remove the seller approval step – FIB webhook will call /webhook/fib automatically when paid.

The fib.py already has functions to get token and create payment requests.

❓ Troubleshooting
Bot doesn't respond
Check that TELEGRAM_TOKEN is correct.

Run python bot.py alone to see errors.

If you previously used webhooks, delete webhook:
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

Dashboard shows errors / no products
Make sure MySQL is running and credentials in .env are correct.

Run python app.py and visit /api/products to see if JSON is returned.

PDF not delivered
Ensure the product type is pdf.

In the dashboard, after uploading a PDF, the file_path must be a Telegram file_id (automatically saved).

Check the terminal for logs from delivery.py.

Can't upload PDF – 500 error
Your ADMIN_TELEGRAM_ID must be a numeric ID (not username). Find yours by sending a message to @userinfobot on Telegram.

The bot must have started a chat with you (send any message to your bot first).

📄 License
This project is open‑source under the MIT License. You are free to use, modify, and distribute it.

🙌 Contributing
Feel free to submit issues or pull requests. For major changes, please open an issue first to discuss.

Made with ❤️ for Iraqi creators and students.
