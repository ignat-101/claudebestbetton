"""
TON FlashBet Backend
Flask API + Telegram Bot
"""

import os
import json
import time
import random
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from functools import wraps

import requests
from flask import Flask, request, jsonify, abort
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins="*")

# ─── Config ───────────────────────────────────────────────────────────────────
BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN")
ADMIN_WALLET = "UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0"
ADMIN_TG_IDS = [int(x) for x in os.environ.get("ADMIN_TG_IDS", "123456789").split(",")]
PLATFORM_FEE = 0.05  # 5%
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# ─── In-memory storage (replace with DB in prod) ──────────────────────────────
DB = {
    "bets": {},
    "users": {},
    "votes": {},
    "transactions": [],
    "treasury": {
        "balance": 142580,
        "total_fees": 8943,
        "total_paid": 98420,
        "wallet": ADMIN_WALLET,
    },
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def validate_tma_data(init_data: str) -> dict | None:
    """Validate Telegram Mini App initData"""
    try:
        params = dict(p.split("=", 1) for p in init_data.split("&") if "=" in p)
        hash_val = params.pop("hash", "")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected_hash, hash_val):
            user_data = json.loads(params.get("user", "{}"))
            return user_data
        return None
    except Exception as e:
        logger.warning(f"TMA validation error: {e}")
        return None


def get_user_from_request():
    """Extract and validate user from request headers"""
    init_data = request.headers.get("X-Init-Data", "")
    if not init_data:
        # Dev mode — allow test user
        if os.environ.get("FLASK_ENV") == "development":
            return {"id": 123456789, "username": "devuser", "first_name": "Dev"}
        return None
    return validate_tma_data(init_data)


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_user_from_request()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        request.tg_user = user
        return f(*args, **kwargs)
    return wrapper


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_user_from_request()
        if not user or user.get("id") not in ADMIN_TG_IDS:
            return jsonify({"error": "Forbidden"}), 403
        request.tg_user = user
        return f(*args, **kwargs)
    return wrapper


def calculate_amm_price(yes_pool: float, no_pool: float) -> dict:
    total = yes_pool + no_pool
    if total == 0:
        return {"yes": 0.5, "no": 0.5}
    return {"yes": round(no_pool / total, 4), "no": round(yes_pool / total, 4)}


def calculate_shares(pool_in: float, pool_out: float, amount_in: float) -> float:
    if pool_in == 0 or pool_out == 0:
        return amount_in
    k = pool_in * pool_out
    new_pool_in = pool_in + amount_in
    new_pool_out = k / new_pool_in
    return pool_out - new_pool_out


def get_crypto_price(symbol: str) -> float | None:
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": symbol, "vs_currencies": "usd"},
            timeout=5,
        )
        data = r.json()
        return data.get(symbol, {}).get("usd")
    except Exception as e:
        logger.error(f"CoinGecko error: {e}")
        return None


def get_or_create_user(tg_user: dict) -> dict:
    uid = str(tg_user["id"])
    if uid not in DB["users"]:
        DB["users"][uid] = {
            "id": uid,
            "telegram_id": tg_user["id"],
            "username": tg_user.get("username", f"user_{uid}"),
            "first_name": tg_user.get("first_name", "User"),
            "last_name": tg_user.get("last_name", ""),
            "stars_balance": 500,  # Welcome bonus
            "ton_balance": 0,
            "reputation": 100,
            "total_wagered": 0,
            "total_won": 0,
            "active_bets": [],
            "resolved_bets": [],
            "voted_bets": [],
            "referral_code": f"FLASH_{random.randint(10000, 99999)}",
            "referrals": [],
            "referral_earnings": 0,
            "joined_at": int(time.time()),
            "is_admin": tg_user["id"] in ADMIN_TG_IDS,
        }
        logger.info(f"New user: {uid}")
    return DB["users"][uid]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": int(time.time()), "version": "1.0.0"})


@app.route("/api/me", methods=["GET"])
@require_auth
def get_me():
    user = get_or_create_user(request.tg_user)
    return jsonify(user)


@app.route("/api/bets", methods=["GET"])
def get_bets():
    category = request.args.get("category", "all")
    status = request.args.get("status", "active")
    
    bets = list(DB["bets"].values())
    
    if category != "all":
        bets = [b for b in bets if b["category"] == category]
    if status != "all":
        bets = [b for b in bets if b["status"] == status]
    
    # Sort by volume
    bets.sort(key=lambda b: b["total_volume"], reverse=True)
    return jsonify(bets)


@app.route("/api/bets/<bet_id>", methods=["GET"])
def get_bet(bet_id: str):
    bet = DB["bets"].get(bet_id)
    if not bet:
        return jsonify({"error": "Not found"}), 404
    return jsonify(bet)


@app.route("/api/bets", methods=["POST"])
@require_auth
def create_bet():
    user = get_or_create_user(request.tg_user)
    data = request.json or {}

    required = ["title", "description", "category", "oracle_type", "resolve_at"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing: {field}"}), 400

    initial_liquidity = max(50, min(2000, int(data.get("initial_liquidity", 100))))
    
    if user["stars_balance"] < initial_liquidity:
        return jsonify({"error": "Insufficient Stars balance"}), 400

    bet_id = f"bet_{int(time.time())}_{random.randint(1000, 9999)}"
    bet = {
        "id": bet_id,
        "title": data["title"][:120],
        "description": data["description"][:500],
        "category": data["category"],
        "creator_id": user["id"],
        "creator_username": user["username"],
        "created_at": int(time.time()),
        "resolve_at": int(data["resolve_at"]),
        "status": "pending",
        "outcome": None,
        "yes_pool": initial_liquidity / 2,
        "no_pool": initial_liquidity / 2,
        "total_volume": initial_liquidity,
        "yes_price": 0.5,
        "no_price": 0.5,
        "participants": [],
        "votes": [],
        "comments": [],
        "price_history": [{"time": int(time.time()), "yes_price": 0.5, "no_price": 0.5, "volume": initial_liquidity}],
        "oracle_type": data["oracle_type"],
        "oracle_symbol": data.get("oracle_symbol"),
        "oracle_target": data.get("oracle_target"),
        "oracle_direction": data.get("oracle_direction", "above"),
        "admin_approved": False,
        "featured": False,
        "tags": data.get("tags", [])[:10],
        "fee_percent": 5,
    }

    DB["bets"][bet_id] = bet
    user["stars_balance"] -= initial_liquidity
    
    # Notify admin
    notify_admins(f"🆕 Новая ставка на модерацию!\n\n📝 {bet['title']}\n👤 @{user['username']}\n💰 {initial_liquidity} ⭐")

    return jsonify({"bet_id": bet_id, "status": "pending_approval"}), 201


@app.route("/api/bets/<bet_id>/place", methods=["POST"])
@require_auth
def place_bet(bet_id: str):
    user = get_or_create_user(request.tg_user)
    bet = DB["bets"].get(bet_id)
    data = request.json or {}

    if not bet:
        return jsonify({"error": "Bet not found"}), 404
    if bet["status"] != "active" or not bet["admin_approved"]:
        return jsonify({"error": "Bet not active"}), 400

    side = data.get("side")
    amount = int(data.get("amount", 0))

    if side not in ("yes", "no"):
        return jsonify({"error": "Invalid side"}), 400
    if amount < 10:
        return jsonify({"error": "Minimum bet is 10 Stars"}), 400
    if user["stars_balance"] < amount:
        return jsonify({"error": "Insufficient Stars"}), 400

    fee = int(amount * PLATFORM_FEE)
    net = amount - fee

    if side == "yes":
        shares = calculate_shares(bet["yes_pool"], bet["no_pool"], net)
        bet["yes_pool"] += net
    else:
        shares = calculate_shares(bet["no_pool"], bet["yes_pool"], net)
        bet["no_pool"] += net

    prices = calculate_amm_price(bet["yes_pool"], bet["no_pool"])
    bet["yes_price"] = prices["yes"]
    bet["no_price"] = prices["no"]
    bet["total_volume"] += amount

    user_bet = {
        "bet_id": bet_id,
        "user_id": user["id"],
        "username": user["username"],
        "side": side,
        "amount": amount,
        "shares": round(shares, 6),
        "timestamp": int(time.time()),
        "avg_price": prices[side],
    }
    bet["participants"].append(user_bet)
    bet["price_history"].append({
        "time": int(time.time()),
        "yes_price": prices["yes"],
        "no_price": prices["no"],
        "volume": amount,
    })

    user["stars_balance"] -= amount
    user["total_wagered"] += amount
    if bet_id not in user["active_bets"]:
        user["active_bets"].append(bet_id)

    DB["treasury"]["balance"] += fee
    DB["treasury"]["total_fees"] += fee

    tx = {
        "id": f"tx_{int(time.time())}_{random.randint(100, 999)}",
        "user_id": user["id"],
        "type": "bet",
        "amount": -amount,
        "bet_id": bet_id,
        "timestamp": int(time.time()),
        "description": f"Ставка {'ДА' if side == 'yes' else 'НЕТ'} — {bet['title'][:50]}",
    }
    DB["transactions"].append(tx)

    return jsonify({
        "success": True,
        "shares": round(shares, 6),
        "new_price": prices,
        "fee": fee,
    })


@app.route("/api/bets/<bet_id>/vote", methods=["POST"])
@require_auth
def vote_bet(bet_id: str):
    user = get_or_create_user(request.tg_user)
    bet = DB["bets"].get(bet_id)
    data = request.json or {}

    if not bet:
        return jsonify({"error": "Bet not found"}), 404
    if bet_id in user["voted_bets"]:
        return jsonify({"error": "Already voted"}), 400

    choice = data.get("choice")
    if choice not in ("yes", "no"):
        return jsonify({"error": "Invalid choice"}), 400

    vote = {
        "user_id": user["id"],
        "username": user["username"],
        "choice": choice,
        "stake": int(user["reputation"] * 0.1),
        "reputation": user["reputation"],
        "timestamp": int(time.time()),
    }
    bet["votes"].append(vote)
    user["voted_bets"].append(bet_id)

    return jsonify({"success": True, "message": "Vote recorded"})


@app.route("/api/bets/<bet_id>/comment", methods=["POST"])
@require_auth
def add_comment(bet_id: str):
    user = get_or_create_user(request.tg_user)
    bet = DB["bets"].get(bet_id)
    data = request.json or {}

    if not bet:
        return jsonify({"error": "Bet not found"}), 404

    text = str(data.get("text", "")).strip()[:500]
    if not text:
        return jsonify({"error": "Empty comment"}), 400

    comment = {
        "id": f"c_{int(time.time())}",
        "user_id": user["id"],
        "username": user["username"],
        "text": text,
        "timestamp": int(time.time()),
        "likes": 0,
    }
    bet["comments"].append(comment)
    return jsonify({"success": True, "comment": comment})


# ─── Admin routes ──────────────────────────────────────────────────────────────

@app.route("/api/admin/bets/<bet_id>/approve", methods=["POST"])
@require_admin
def approve_bet(bet_id: str):
    bet = DB["bets"].get(bet_id)
    if not bet:
        return jsonify({"error": "Not found"}), 404

    bet["admin_approved"] = True
    bet["status"] = "active"
    
    # Notify creator
    creator = DB["users"].get(bet["creator_id"])
    if creator:
        notify_user(
            creator["telegram_id"],
            f"✅ Ваша ставка одобрена!\n\n📝 {bet['title']}\n\nТеперь пользователи могут делать ставки!"
        )

    return jsonify({"success": True})


@app.route("/api/admin/bets/<bet_id>/reject", methods=["POST"])
@require_admin
def reject_bet(bet_id: str):
    bet = DB["bets"].get(bet_id)
    if not bet:
        return jsonify({"error": "Not found"}), 404

    data = request.json or {}
    reason = data.get("reason", "Не соответствует правилам платформы")

    bet["status"] = "cancelled"
    
    # Refund creator
    creator = DB["users"].get(bet["creator_id"])
    if creator:
        refund = bet["yes_pool"] + bet["no_pool"]
        creator["stars_balance"] += refund
        notify_user(
            creator["telegram_id"],
            f"❌ Ставка отклонена\n\n📝 {bet['title']}\n💡 Причина: {reason}\n\n💰 Возврат: {refund} ⭐"
        )

    return jsonify({"success": True})


@app.route("/api/admin/bets/<bet_id>/resolve", methods=["POST"])
@require_admin
def resolve_bet(bet_id: str):
    bet = DB["bets"].get(bet_id)
    if not bet:
        return jsonify({"error": "Not found"}), 404

    data = request.json or {}
    outcome = data.get("outcome")
    if outcome not in ("yes", "no"):
        return jsonify({"error": "Invalid outcome"}), 400

    bet["status"] = "resolved"
    bet["outcome"] = outcome

    winners = [p for p in bet["participants"] if p["side"] == outcome]
    total_shares = sum(p["shares"] for p in winners)
    total_pool = bet["yes_pool"] + bet["no_pool"]
    fee = int(total_pool * PLATFORM_FEE)
    prize_pool = total_pool - fee

    DB["treasury"]["total_fees"] += fee
    DB["treasury"]["total_paid"] += prize_pool

    for winner in winners:
        user = DB["users"].get(winner["user_id"])
        if user and total_shares > 0:
            reward = int((winner["shares"] / total_shares) * prize_pool)
            user["stars_balance"] += reward
            user["total_won"] += reward
            user["reputation"] += 10  # Reputation boost for winning
            
            notify_user(
                user["telegram_id"],
                f"🎉 Вы выиграли!\n\n📝 {bet['title']}\n💰 Выигрыш: {reward} ⭐\n⭐ Репутация +10"
            )

    # Reward correct voters
    correct_voters = [v for v in bet["votes"] if v["choice"] == outcome]
    wrong_voters = [v for v in bet["votes"] if v["choice"] != outcome]
    
    if correct_voters and fee > 0:
        voter_pool = int(fee * 0.4)  # 40% of fee goes to correct voters
        total_voter_stake = sum(v["stake"] for v in correct_voters)
        for voter in correct_voters:
            user = DB["users"].get(voter["user_id"])
            if user and total_voter_stake > 0:
                voter_reward = int((voter["stake"] / total_voter_stake) * voter_pool)
                user["stars_balance"] += voter_reward
                user["reputation"] += 5
    
    # Penalize wrong voters
    for voter in wrong_voters:
        user = DB["users"].get(voter["user_id"])
        if user:
            user["reputation"] = max(10, user["reputation"] - 2)

    return jsonify({"success": True, "outcome": outcome, "prize_pool": prize_pool})


@app.route("/api/admin/oracle/check/<bet_id>", methods=["POST"])
@require_admin
def oracle_check(bet_id: str):
    """Auto-resolve bet using price oracle"""
    bet = DB["bets"].get(bet_id)
    if not bet or bet["oracle_type"] != "price":
        return jsonify({"error": "Not a price oracle bet"}), 400

    symbol = bet.get("oracle_symbol")
    target = bet.get("oracle_target")
    direction = bet.get("oracle_direction", "above")

    if not symbol or not target:
        return jsonify({"error": "Oracle not configured"}), 400

    current_price = get_crypto_price(symbol)
    if current_price is None:
        return jsonify({"error": "Could not fetch price"}), 503

    if direction == "above":
        outcome = "yes" if current_price >= target else "no"
    else:
        outcome = "yes" if current_price <= target else "no"

    return jsonify({
        "symbol": symbol,
        "current_price": current_price,
        "target": target,
        "direction": direction,
        "outcome": outcome,
        "resolved": False,  # Admin must confirm
    })


@app.route("/api/treasury", methods=["GET"])
def get_treasury():
    recent_txs = sorted(DB["transactions"], key=lambda t: t["timestamp"], reverse=True)[:20]
    return jsonify({
        **DB["treasury"],
        "recent_transactions": recent_txs,
        "active_bets": len([b for b in DB["bets"].values() if b["status"] == "active"]),
        "total_bets": len(DB["bets"]),
    })


@app.route("/api/prices", methods=["GET"])
def get_prices():
    symbols = request.args.get("symbols", "bitcoin,ethereum,the-open-network,solana")
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": symbols, "vs_currencies": "usd", "include_24hr_change": "true"},
            timeout=5,
        )
        return jsonify(r.json())
    except Exception:
        return jsonify({"error": "Price service unavailable"}), 503


@app.route("/api/stars/buy", methods=["POST"])
@require_auth
def buy_stars():
    """Handle Telegram Stars payment"""
    user = get_or_create_user(request.tg_user)
    data = request.json or {}
    
    stars = int(data.get("stars", 0))
    if stars < 50:
        return jsonify({"error": "Minimum 50 Stars"}), 400
    
    # In production: verify Telegram payment here
    payment_id = data.get("payment_id")
    if not payment_id:
        return jsonify({"error": "Payment ID required"}), 400
    
    user["stars_balance"] += stars
    
    tx = {
        "id": f"tx_{int(time.time())}",
        "user_id": user["id"],
        "type": "deposit",
        "amount": stars,
        "timestamp": int(time.time()),
        "description": f"Пополнение через Telegram Stars: {stars} ⭐",
    }
    DB["transactions"].append(tx)
    DB["treasury"]["balance"] += stars
    
    return jsonify({"success": True, "new_balance": user["stars_balance"]})


# ─── Telegram Bot notifications ────────────────────────────────────────────────

def notify_user(telegram_id: int, text: str):
    """Send Telegram notification to user"""
    try:
        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={"chat_id": telegram_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
    except Exception as e:
        logger.error(f"Notify error: {e}")


def notify_admins(text: str):
    """Notify all admins"""
    for admin_id in ADMIN_TG_IDS:
        notify_user(admin_id, text)


# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    logger.info(f"Starting TON FlashBet backend on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
