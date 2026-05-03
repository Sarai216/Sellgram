import os
import logging
import requests as req
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from db import get_connection, fetchall_as_dict, fetchone_as_dict
from delivery import deliver_product

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_API   = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# ========== SERVE DASHBOARD & STATIC FILES ==========
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# ========== YOUR EXISTING API ROUTES ==========
@app.route("/webhook/fib", methods=["POST"])
def fib_webhook():
    data = request.json
    payment_id = data.get("id")
    status = data.get("status")
    if not payment_id or not status:
        return jsonify({"error": "invalid payload"}), 400
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE payment_id = %s", (payment_id,))
    order = fetchone_as_dict(cursor)
    conn.close()
    if not order:
        return jsonify({"error": "order not found"}), 404
    if status == "PAID" and order["status"] != "paid":
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'paid' WHERE id = %s", (order["id"],))
        conn.commit()
        conn.close()
        deliver_product(order)
    elif status == "DECLINED":
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order["id"],))
        conn.commit()
        conn.close()
    return jsonify({"ok": True}), 200

@app.route("/api/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files allowed"}), 400
    ADMIN_CHAT_ID = os.getenv("ADMIN_TELEGRAM_ID")
    if not ADMIN_CHAT_ID:
        return jsonify({"error": "ADMIN_TELEGRAM_ID not set"}), 500
    try:
        response = req.post(
            f"{TELEGRAM_API}/sendDocument",
            data={"chat_id": ADMIN_CHAT_ID, "caption": f"📄 {file.filename}"},
            files={"document": (file.filename, file.stream, "application/pdf")}
        )
        result = response.json()
        if not result.get("ok"):
            return jsonify({"error": result.get("description", "Upload failed")}), 500
        file_id = result["result"]["document"]["file_id"]
        return jsonify({"file_id": file_id, "filename": file.filename}), 200
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, product_id, status FROM orders")
    all_orders = cursor.fetchall()
    paid_orders = [o for o in all_orders if o[2] in ('paid', 'delivered')]
    total_revenue = 0
    for order in paid_orders:
        cursor.execute("SELECT price FROM products WHERE id = %s", (order[1],))
        product = cursor.fetchone()
        if product:
            total_revenue += product[0]
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    conn.close()
    return jsonify({
        "total_orders": len(paid_orders),
        "total_products": total_products,
        "total_revenue": total_revenue,
    })

@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, s.name AS seller_name
        FROM products p
        LEFT JOIN sellers s ON p.seller_id = s.id
    """)
    data = fetchall_as_dict(cursor)
    conn.close()
    return jsonify(data)

@app.route("/api/products", methods=["POST"])
def add_product():
    body = request.json
    required = ["seller_id", "name", "price", "type"]
    for field in required:
        if field not in body:
            return jsonify({"error": f"Missing field: {field}"}), 400
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO products (seller_id, name, price, type, file_path, product_code) VALUES (%s, %s, %s, %s, %s, %s)",
        (body["seller_id"], body["name"], body["price"], body["type"], body.get("file_path"), body.get("product_code"))
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 201

@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    body = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE products SET name=%s, price=%s, type=%s, file_path=%s WHERE id=%s",
        (body["name"], body["price"], body["type"], body.get("file_path"), product_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 200

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 200

@app.route("/api/orders", methods=["GET"])
def get_orders():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT o.*, p.name AS product_name, p.price AS product_price
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.id DESC
    """)
    data = fetchall_as_dict(cursor)
    conn.close()
    return jsonify(data)

@app.route("/api/sellers", methods=["GET"])
def get_sellers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sellers")
    data = fetchall_as_dict(cursor)
    conn.close()
    return jsonify(data)

@app.route("/api/sellers", methods=["POST"])
def add_seller():
    body = request.json
    if "name" not in body:
        return jsonify({"error": "name is required"}), 400
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sellers (name, fib_account, telegram_id) VALUES (%s, %s, %s)",
        (body["name"], body.get("fib_account"), body.get("telegram_id"))
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 201

@app.route("/api/test-order", methods=["POST"])
def create_test_order():
    body = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (payment_id, user_id, product_id, status) VALUES (%s, %s, %s, 'pending')",
        (body["payment_id"], body["user_id"], body["product_id"])
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 201

if __name__ == "__main__":
    app.run(debug=True, port=5000)