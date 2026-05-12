# crypto-hockey-frontend

Telegram Mini App for Crypto Hockey aerohockey matches. Talks WSS to `crypto-hockey-game-engine`.

## Run

```bash
cp .env.example .env # optional
npm install
npm run dev
```

Open the Vite URL with `#matchId=<id>` and the dev mock running (`npm run test:e2e` starts one), or against the real engine via `VITE_ENGINE_WS_URL=wss://engine.example/ws`.

## Tests

```bash
npm test           # unit
npm run test:e2e   # Playwright
```

## Telegram

This is a Mini App. In production the bot's WebApp button opens it with `?matchId=...` appended; we read that from `window.location.hash`.
