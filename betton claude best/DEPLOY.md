# 🚀 Инструкция по деплою FlashBet TON

## Вариант 1: Netlify (бесплатно, рекомендован)

### Автоматический деплой через GitHub
1. Зайди на [netlify.com](https://netlify.com) → Sign Up (через GitHub)
2. Нажми **"Add new site"** → **"Import an existing project"**
3. Выбери свой GitHub репозиторий
4. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Нажми **"Deploy site"**
6. Получи URL вида `https://your-site.netlify.app`

### Ручной деплой (drag & drop)
```bash
npm run build
```
Затем перетащи папку `dist/` на [app.netlify.com/drop](https://app.netlify.com/drop)

---

## Вариант 2: Vercel (бесплатно)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Или через UI:
1. [vercel.com](https://vercel.com) → Import Project
2. Выбери репозиторий
3. Build: `npm run build`, Output: `dist`
4. Deploy

---

## Вариант 3: GitHub Pages (бесплатно)

1. В `vite.config.ts` добавь `base: '/имя-репозитория/'`
2. Установи `gh-pages`:
```bash
npm install -D gh-pages
```
3. В `package.json` добавь:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```
4. Запусти:
```bash
npm run deploy
```
5. В GitHub → Settings → Pages → Source: `gh-pages` branch

---

## Вариант 4: Render (бесплатно)

1. [render.com](https://render.com) → New Static Site
2. Подключи GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy

---

## Вариант 5: Cloudflare Pages (бесплатно, быстрый CDN)

1. [pages.cloudflare.com](https://pages.cloudflare.com) → Create project
2. Connect to Git → выбери репозиторий
3. Build: `npm run build`, Output: `dist`
4. Deploy

---

## Настройка TON Connect Manifest

После деплоя обнови `public/tonconnect-manifest.json`:
```json
{
  "url": "https://твой-домен.netlify.app",
  "name": "FlashBet TON",
  "iconUrl": "https://твой-домен.netlify.app/icon.png"
}
```

---

## Настройка бэкенда (опционально)

Для продакшена нужен Python бэкенд (из репозитория `backend/`):

### Render.com (бесплатный tier)
```bash
# requirements.txt уже есть в backend/
pip install -r backend/requirements.txt
python backend/app.py
```

Или в Render: New Web Service → Python → Start command: `python backend/app.py`

### Railway.app
```bash
railway login
railway new
railway up
```

---

## Переменные окружения

Для бэкенда создай `.env` файл:
```env
BOT_TOKEN=твой_telegram_bot_token
SECRET_KEY=случайная_строка_32_символа
FRONTEND_URL=https://твой-домен.netlify.app
```

---

## Локальный запуск

```bash
git clone https://github.com/ignat-101/claudebestbetton
cd "betton claude best"
npm install
npm run dev
```

Откроется на [http://localhost:5173](http://localhost:5173)

---

## Добавление в Telegram Mini App

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → создайте бота
3. `/mybots` → ваш бот → Bot Settings → Menu Button → URL
4. Вставьте URL вашего задеплоенного сайта
5. Тест: откройте бота → нажмите кнопку меню

---

## Продакшен чеклист

- [ ] Заменить URL в `tonconnect-manifest.json`
- [ ] Настроить реальный бэкенд (не mock данные)
- [ ] Подключить реальный TON смарт-контракт
- [ ] Настроить Telegram Bot через BotFather
- [ ] Включить HTTPS (Netlify/Vercel делают автоматически)
- [ ] Настроить custom domain (опционально)
