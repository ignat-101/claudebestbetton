"""
TON FlashBet Telegram Bot
Handles /start, Stars payments, notifications
"""

import os
import logging
import asyncio
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
    LabeledPrice,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    PreCheckoutQueryHandler,
    ContextTypes,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN")
TMA_URL = os.environ.get("TMA_URL", "https://your-app.onrender.com")
ADMIN_IDS = [int(x) for x in os.environ.get("ADMIN_TG_IDS", "123456789").split(",")]

WELCOME_TEXT = """
🎯 <b>TON FlashBet — Ставки на ВСЁ</b>

Моментальные ставки на любые события через Telegram!

<b>Как это работает:</b>
⚡ Выбираешь событие → ставишь Stars → ждёшь результата

<b>Преимущества:</b>
₿ Ставки на криптовалюты, спорт, политику, погоду
🎲 Создавай свои ставки на любые события
💎 Прозрачные пулы ликвидности как на Polymarket
🗳 Голосование валидаторов (Proof of Stake)
💰 Реферальная программа — 1% от ставок друзей
🔐 TON Connect — ваш кошелёк под контролем

Нажми кнопку ниже, чтобы начать! 👇
"""


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    
    # Handle referral
    if context.args:
        ref_code = context.args[0]
        # TODO: Apply referral code via API
        logger.info(f"User {user.id} joined via referral: {ref_code}")

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🎯 Открыть FlashBet",
            web_app=WebAppInfo(url=TMA_URL)
        )],
        [
            InlineKeyboardButton("💬 Чат сообщества", url="https://t.me/FlashBetChat"),
            InlineKeyboardButton("📊 Статистика", callback_data="stats"),
        ],
        [InlineKeyboardButton("💎 Купить Stars", callback_data="buy_stars")],
    ])

    await update.message.reply_html(
        WELCOME_TEXT,
        reply_markup=keyboard,
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    text = """
📚 <b>Помощь по TON FlashBet</b>

<b>Команды:</b>
/start — Главное меню
/stats — Ваша статистика
/balance — Баланс Stars
/referral — Реферальная ссылка
/top — Топ ставок
/help — Это сообщение

<b>Как ставить:</b>
1. Открой приложение кнопкой меню
2. Выбери событие из списка
3. Выбери исход (ДА или НЕТ)
4. Укажи сумму в Stars
5. Подтверди ставку

<b>Как создать ставку:</b>
1. Перейди на вкладку "Создать"
2. Заполни форму (4 шага)
3. Дожди одобрения администратора
4. Ставка активна!

<b>Вопросы?</b> t.me/FlashBetSupport
"""
    await update.message.reply_html(text)


async def stats_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user stats"""
    # TODO: Fetch from API
    user = update.effective_user
    text = f"""
📊 <b>Статистика @{user.username}</b>

⭐ Баланс: <b>5,000 Stars</b>
🎯 Ставок сделано: <b>12</b>
✅ Побед: <b>7 (58%)</b>
💰 Выиграно: <b>4,100 Stars</b>
⚡ Репутация: <b>847</b>

👥 Рефералов: <b>3</b>
💎 Заработано с рефералов: <b>450 Stars</b>
"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📈 Открыть портфолио", web_app=WebAppInfo(url=f"{TMA_URL}?tab=portfolio"))]
    ])
    await update.message.reply_html(text, reply_markup=keyboard)


async def balance_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show balance and buy options"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("💎 Купить 100 Stars", callback_data="buy_100")],
        [InlineKeyboardButton("💎 Купить 500 Stars", callback_data="buy_500")],
        [InlineKeyboardButton("💎 Купить 1000 Stars", callback_data="buy_1000")],
        [InlineKeyboardButton("🎯 Открыть приложение", web_app=WebAppInfo(url=TMA_URL))],
    ])
    await update.message.reply_html(
        "💰 <b>Ваш баланс: 5,000 Stars</b>\n\nПополни баланс для ставок:",
        reply_markup=keyboard,
    )


async def referral_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show referral info"""
    user = update.effective_user
    ref_code = f"FLASH_{user.id % 99999}"
    ref_link = f"https://t.me/FlashBetBot?start={ref_code}"
    
    text = f"""
👥 <b>Реферальная программа</b>

Приглашай друзей и зарабатывай <b>1%</b> от каждой их ставки навсегда!

🔗 Твоя ссылка:
<code>{ref_link}</code>

📊 Статистика:
• Рефералов: <b>3</b>
• Заработано: <b>450 Stars</b>
"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📤 Поделиться", url=f"https://t.me/share/url?url={ref_link}&text=Ставь%20на%20всё%20с%20TON%20FlashBet!")]
    ])
    await update.message.reply_html(text, reply_markup=keyboard)


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline button callbacks"""
    query = update.callback_query
    await query.answer()

    if query.data == "stats":
        await stats_cmd(update, context)
    elif query.data == "buy_stars":
        await balance_cmd(update, context)
    elif query.data.startswith("buy_"):
        amounts = {"buy_100": 100, "buy_500": 500, "buy_1000": 1000}
        stars = amounts.get(query.data, 100)
        # Send invoice
        await context.bot.send_invoice(
            chat_id=query.message.chat_id,
            title=f"TON FlashBet — {stars} Stars",
            description=f"Пополнение баланса на {stars} Stars для ставок",
            payload=f"stars_{stars}_{query.from_user.id}",
            provider_token="",  # Empty for Telegram Stars
            currency="XTR",  # Telegram Stars
            prices=[LabeledPrice(f"{stars} Stars", stars)],
        )


async def pre_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle pre-checkout query"""
    query = update.pre_checkout_query
    await query.answer(ok=True)


async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle successful Stars payment"""
    payment = update.message.successful_payment
    stars = payment.total_amount
    user = update.effective_user
    
    logger.info(f"Payment: {user.id} paid {stars} Stars")
    
    # TODO: Credit balance via API
    
    await update.message.reply_html(
        f"✅ <b>Оплата получена!</b>\n\n"
        f"💰 Зачислено: <b>{stars} Stars</b>\n"
        f"🎯 Можете делать ставки!",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🎯 Открыть FlashBet", web_app=WebAppInfo(url=TMA_URL))]
        ])
    )


# ─── Admin commands ────────────────────────────────────────────────────────────

async def admin_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin panel"""
    if update.effective_user.id not in ADMIN_IDS:
        await update.message.reply_text("❌ Нет доступа")
        return

    text = """
🛡 <b>Панель администратора</b>

Используй веб-панель для управления ставками:
"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🛡 Открыть Admin Panel", web_app=WebAppInfo(url=f"{TMA_URL}?tab=admin"))]
    ])
    await update.message.reply_html(text, reply_markup=keyboard)


async def broadcast_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Broadcast message to all users"""
    if update.effective_user.id not in ADMIN_IDS:
        return
    
    if not context.args:
        await update.message.reply_text("Использование: /broadcast <текст>")
        return
    
    msg = " ".join(context.args)
    logger.info(f"Admin broadcast: {msg}")
    # TODO: Send to all users
    await update.message.reply_text(f"✅ Broadcast отправлен: {msg[:50]}...")


def main():
    """Start the bot"""
    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("stats", stats_cmd))
    app.add_handler(CommandHandler("balance", balance_cmd))
    app.add_handler(CommandHandler("referral", referral_cmd))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(CommandHandler("broadcast", broadcast_cmd))

    # Callbacks
    app.add_handler(CallbackQueryHandler(callback_handler))

    # Payments
    app.add_handler(PreCheckoutQueryHandler(pre_checkout))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))

    logger.info("Bot started!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
