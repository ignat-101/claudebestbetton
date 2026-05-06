# 🎯 TON FlashBet — Ставки на ВСЁ

Моментальные ставки на любые события через Telegram Mini App и TON блокчейн.

## 🚀 Быстрый старт — Render.com

### Шаг 1: Подготовка

#### 1.1 Создайте Telegram бота
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Введите имя бота: `TON FlashBet`
4. Введите username: `FlashBetBot` (должен быть уникальным)
5. **Скопируйте токен** — он выглядит так: `1234567890:ABCdef...`

#### 1.2 Получите ваш Telegram ID
1. Откройте [@userinfobot](https://t.me/userinfobot)
2. Нажмите `/start`
3. Скопируйте ваш **ID** (число)

#### 1.3 Залейте на GitHub
```bash
git init
git add .
git commit -m "Initial commit: TON FlashBet"
git remote add origin https://github.com/YOUR_USERNAME/flashbet.git
git push -u origin main
```

---

### Шаг 2: Деплой Frontend (TMA) на Render

1. Зайдите на [render.com](https://render.com) → `New` → `Static Site`
2. Подключите ваш GitHub репозиторий
3. Настройте:
   - **Name**: `flashbet-tma`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. В `Advanced` → `Headers` добавьте:
   - `X-Frame-Options: ALLOW-FROM https://telegram.org`
5. Нажмите **Create Static Site**
6. **Скопируйте URL** вашего сайта (например: `https://flashbet-tma.onrender.com`)

---

### Шаг 3: Деплой Backend API на Render

1. `New` → `Web Service`
2. Подключите тот же GitHub репозиторий
3. Настройте:
   - **Name**: `flashbet-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
4. **Environment Variables** (вкладка `Environment`):
   ```
   BOT_TOKEN=ваш_токен_от_BotFather
   ADMIN_TG_IDS=ваш_telegram_id
   TMA_URL=https://flashbet-tma.onrender.com
   FLASK_ENV=production
   ```
5. Нажмите **Create Web Service**
6. Дождитесь деплоя (2-3 минуты)
7. Проверьте: `https://flashbet-api.onrender.com/api/health`

---

### Шаг 4: Деплой Telegram Bot на Render

1. `New` → `Background Worker`
2. Настройте:
   - **Name**: `flashbet-bot`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python bot.py`
3. **Environment Variables**:
   ```
   BOT_TOKEN=ваш_токен
   ADMIN_TG_IDS=ваш_telegram_id
   TMA_URL=https://flashbet-tma.onrender.com
   ```
4. **Create Background Worker**

---

### Шаг 5: Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/BotFather)
2. Выберите вашего бота → `Bot Settings` → `Menu Button`
3. Нажмите `Configure menu button`
4. Введите URL: `https://flashbet-tma.onrender.com`
5. Введите текст кнопки: `🎯 FlashBet`

#### Настройка Web App
```
/setmenubutton
@FlashBetBot
Открыть FlashBet | https://flashbet-tma.onrender.com
```

#### Разрешить Stars платежи
```
@BotFather → /mybots → @FlashBetBot → Bot Settings → Payments
→ Enable Stars Payments
```

---

### Шаг 6: Проверка

1. Найдите вашего бота в Telegram
2. Нажмите `/start`
3. Откройте мини-приложение кнопкой меню
4. Убедитесь что:
   - ✅ Список ставок загружается
   - ✅ Вкладки навигации работают
   - ✅ Кнопка "Создать ставку" открывает форму
   - ✅ Admin panel доступен (вы должны быть в ADMIN_TG_IDS)

---

## 🏗️ Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐
│   Telegram App  │    │   TMA Frontend   │    │  Flask API    │
│                 │◄──►│  React + Vite    │◄──►│  Python       │
│  Bot commands   │    │  Tailwind CSS    │    │  Backend      │
│  Stars payment  │    │  Liquid Glass UI │    │               │
└─────────────────┘    └──────────────────┘    └───────────────┘
                                                        │
                                               ┌────────────────┐
                                               │  CoinGecko API │
                                               │  Price Oracle  │
                                               └────────────────┘
```

## 🔐 Безопасность

| Компонент | Защита |
|-----------|--------|
| API | TMA initData валидация (HMAC-SHA256) |
| Admin | Проверка Telegram ID в ADMIN_TG_IDS |
| Ставки | Proof-of-Stake голосование валидаторов |
| Оракул | CoinGecko API для цен + Admin confirm |
| Казна | Публичный TON кошелёк, открытые транзакции |

## 💰 Экономика

| Источник | Процент |
|----------|---------|
| Комиссия с каждой ставки | 5% |
| Валидаторам (правильные голоса) | 2% |
| Реферальные выплаты | 1% |
| Доход платформы | 2% |

## 🎯 Функции

- ✅ **AMM** (Automated Market Maker) — цены меняются от объема ставок
- ✅ **Proof of Stake голосование** — валидаторы определяют результат
- ✅ **Price Oracle** — автоматическая проверка крипто-ставок
- ✅ **Telegram Stars** — нативная оплата через Telegram
- ✅ **TON Connect** — подключение TON кошелька
- ✅ **Реферальная система** — 1% с каждой ставки реферала
- ✅ **Admin panel** — модерация, одобрение, завершение ставок
- ✅ **Live графики** — динамика вероятностей в реальном времени
- ✅ **Прозрачная казна** — открытый баланс и транзакции

## 📁 Структура проекта

```
flashbet/
├── src/                    # Frontend (React TMA)
│   ├── App.tsx             # Главный компонент + навигация
│   ├── store/useStore.ts   # Zustand state management
│   ├── components/
│   │   ├── BetsList.tsx    # Список ставок
│   │   ├── BetDetail.tsx   # Детали ставки + торговля
│   │   ├── BetCard.tsx     # Карточка ставки
│   │   ├── CreateBet.tsx   # Создание ставки (4 шага)
│   │   ├── Portfolio.tsx   # Портфолио пользователя
│   │   ├── AdminPanel.tsx  # Панель администратора
│   │   ├── Profile.tsx     # Профиль + TON Connect
│   │   └── CryptoTicker.tsx# Бегущая строка цен
│   └── index.css           # Liquid Glass стили
├── backend/
│   ├── app.py              # Flask REST API
│   ├── bot.py              # Telegram Bot (python-telegram-bot)
│   ├── requirements.txt    # Python зависимости
│   └── .env.example        # Пример переменных окружения
├── render.yaml             # Конфигурация Render.com
└── README.md               # Эта инструкция
```

## 🤝 Поддержка

- Telegram: [@FlashBetSupport](https://t.me/FlashBetSupport)
- Admin wallet: `UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0`

---

*TON FlashBet v1.0.0 — Powered by TON & Telegram Stars* 🚀
