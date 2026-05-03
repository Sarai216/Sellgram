import os
import logging
import requests
from db import get_connection, fetchone_as_dict

logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_API   = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

def send_telegram_message(chat_id: int, text: str):
    requests.post(f"{TELEGRAM_API}/sendMessage", json={
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    })

def send_telegram_document(chat_id: int, file_id_or_url: str, caption: str = ""):
    """Send a PDF file using either a Telegram file_id or a public URL."""
    requests.post(f"{TELEGRAM_API}/sendDocument", json={
        "chat_id": chat_id,
        "document": file_id_or_url,
        "caption": caption,
        "parse_mode": "Markdown"
    })

def get_product_with_seller(product_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, s.id AS seller_id, s.name AS seller_name,
               s.telegram_id AS seller_telegram_id
        FROM products p
        LEFT JOIN sellers s ON p.seller_id = s.id
        WHERE p.id = %s
    """, (product_id,))
    product = fetchone_as_dict(cursor)
    conn.close()
    return product

def deliver_product(order: dict):
    user_id = order["user_id"]
    product_id = order["product_id"]

    product = get_product_with_seller(product_id)
    if not product:
        logger.error(f"Product {product_id} not found for delivery")
        return

    product_type = product.get("type")
    product_name = product.get("name")
    file_path = product.get("file_path")   # can be Telegram file_id or invite link

    try:
        # ✅ Handle PDF files
        if product_type == "pdf" and file_path:
            # file_path is a Telegram file_id (from /api/upload)
            send_telegram_document(
                chat_id=user_id,
                file_id_or_url=file_path,
                caption=f"✅ *{product_name}* — شكراً على شرائك!"
            )
            logger.info(f"PDF sent to user {user_id}: {product_name}")

        # ✅ Handle Course (Telegram invite link)
        elif product_type == "course" and file_path:
            # Check if it's a Telegram invite link or any URL
            if "t.me" in file_path or file_path.startswith("http"):
                message = (
                    f"✅ *شكراً على شرائك!*\n\n"
                    f"📦 المنتج: *{product_name}*\n\n"
                    f"🔗 رابط الكورس الخاص بك:\n{file_path}\n\n"
                    f"⚠️ هذا الرابط للاستخدام مرة واحدة فقط."
                )
                send_telegram_message(user_id, message)
                logger.info(f"Course link sent to user {user_id}: {product_name}")
            else:
                # It might be a file_id but type is course? fallback
                send_telegram_message(
                    user_id,
                    f"✅ تم تأكيد طلبك: *{product_name}*. سيتم إرسال الرابط قريباً."
                )

        # Fallback for unknown types
        else:
            send_telegram_message(
                user_id,
                f"✅ تم تأكيد طلبك: *{product_name}*. سيتم التواصل معك قريباً."
            )
            logger.warning(f"Unknown product type or missing file_path for order {order['id']}")

        # Notify seller (optional, but nice)
        seller_tg = product.get("seller_telegram_id")
        if seller_tg:
            send_telegram_message(
                seller_tg,
                f"🎉 *تم تسليم المنتج تلقائياً!*\n\n📦 {product_name}\n👤 المشتري: `{user_id}`"
            )

        # Mark order as delivered
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'delivered' WHERE id = %s", (order["id"],))
        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Delivery failed for order {order['id']}: {e}")