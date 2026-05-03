import os
import logging
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)
from dotenv import load_dotenv
from db import get_connection, fetchall_as_dict, fetchone_as_dict
from delivery import deliver_product

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
BOT_USERNAME   = os.getenv("BOT_USERNAME", "SellgramBot")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if args and args[0].startswith("product_"):
        product_id = int(args[0].split("_")[1])
        await show_product(update, context, product_id)
        return
    await show_all_products(update, context)

async def show_all_products(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    products = fetchall_as_dict(cursor)
    conn.close()

    if not products:
        await update.message.reply_text("لا توجد منتجات متاحة حالياً.")
        return

    text = "🛍️ *المنتجات المتاحة:*\n\n"
    keyboard = []
    for p in products:
        text += f"• *{p['name']}* — {p['price']:,} IQD\n"
        keyboard.append([InlineKeyboardButton(f"🛒 شراء: {p['name']}", callback_data=f"buy_{p['id']}")])

    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

async def show_product(update: Update, context: ContextTypes.DEFAULT_TYPE, product_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = fetchone_as_dict(cursor)
    conn.close()

    if not product:
        await update.message.reply_text("المنتج غير موجود.")
        return

    text = (f"📦 *{product['name']}*\n💰 السعر: {product['price']:,} IQD\n\nاضغط الزر أدناه للشراء:")
    keyboard = [[InlineKeyboardButton("🛒 اشتري الآن", callback_data=f"buy_{product_id}")]]
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

# Buy button -> create order + show payment instructions
async def handle_buy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    product_id = int(query.data.split("_")[1])
    user_id = query.from_user.id

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = fetchone_as_dict(cursor)
    conn.close()

    if not product:
        await query.edit_message_text("المنتج غير موجود.")
        return

    payment_id = str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (payment_id, user_id, product_id, status) VALUES (%s, %s, %s, 'pending')",
        (payment_id, user_id, product_id)
    )
    conn.commit()
    conn.close()

    text = (
        f"🛒 *طلبك جاهز!*\n\n"
        f"📦 المنتج: {product['name']}\n"
        f"💰 المبلغ: {product['price']:,} IQD\n\n"
        f"📲 *طريقة الدفع (محاكاة):*\n"
        f"قم بتحويل المبلغ إلى حساب البائع، ثم اضغط الزر أدناه ✅\n\n"
        f"*ملاحظة:* هذه نسخة تجريبية، لن يتم خصم أي مبلغ حقيقي."
    )
    keyboard = [[InlineKeyboardButton("✅ دفعت — أبلغ البائع", callback_data=f"confirm_{payment_id}")]]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

# Buyer confirms payment -> notify seller
async def handle_confirm_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    payment_id = query.data.split("_", 1)[1]
    user_id = query.from_user.id

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE payment_id = %s", (payment_id,))
    order = fetchone_as_dict(cursor)
    conn.close()

    if not order:
        await query.edit_message_text("الطلب غير موجود.")
        return

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = %s", (order["product_id"],))
    product = fetchone_as_dict(cursor)
    conn.close()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sellers WHERE id = %s", (product["seller_id"],))
    seller = fetchone_as_dict(cursor)
    conn.close()

    if seller and seller.get("telegram_id"):
        keyboard = [[
            InlineKeyboardButton("✅ تأكيد الدفع", callback_data=f"approve_{payment_id}"),
            InlineKeyboardButton("❌ رفض", callback_data=f"reject_{payment_id}")
        ]]
        await context.bot.send_message(
            chat_id=seller["telegram_id"],
            text=(
                f"💰 *طلب دفع جديد!*\n\n"
                f"📦 المنتج: {product['name']}\n"
                f"💵 المبلغ: {product['price']:,} IQD\n"
                f"👤 المشتري: `{user_id}`\n\n"
                f"هل تأكد الدفع؟"
            ),
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        await query.edit_message_text("✅ *تم إرسال طلبك للبائع!*\n\nسيتم التواصل معك بعد تأكيد الدفع.", parse_mode="Markdown")
    else:
        await query.edit_message_text("⚠️ لم يتم العثور على البائع. يرجى التواصل مع الدعم.")

# Seller approves -> deliver product
async def handle_seller_decision(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    action, payment_id = query.data.split("_", 1)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE payment_id = %s", (payment_id,))
    order = fetchone_as_dict(cursor)
    conn.close()

    if not order:
        await query.edit_message_text("الطلب غير موجود.")
        return

    if action == "approve":
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'paid' WHERE payment_id = %s", (payment_id,))
        conn.commit()
        conn.close()

        deliver_product(order)   # sends the file/link to buyer
        await query.edit_message_text("✅ تم تأكيد الدفع وإرسال المنتج للمشتري!")

    elif action == "reject":
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'cancelled' WHERE payment_id = %s", (payment_id,))
        conn.commit()
        conn.close()

        await context.bot.send_message(
            chat_id=order["user_id"],
            text="❌ عذراً، لم يتم تأكيد دفعك. تواصل مع البائع."
        )
        await query.edit_message_text("❌ تم رفض الدفع وإبلاغ المشتري.")

def run_bot():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_buy, pattern=r"^buy_\d+$"))
    app.add_handler(CallbackQueryHandler(handle_confirm_payment, pattern=r"^confirm_.+$"))
    app.add_handler(CallbackQueryHandler(handle_seller_decision, pattern=r"^approve_.+$"))
    app.add_handler(CallbackQueryHandler(handle_seller_decision, pattern=r"^reject_.+$"))
    logger.info("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    run_bot()