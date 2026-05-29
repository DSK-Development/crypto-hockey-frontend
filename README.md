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

## Docker (production)

```bash
docker build \
  --build-arg VITE_ENGINE_WS_URL=wss://engine.example/ws \
  -t crypto-hockey-frontend .
docker run -p 80:80 crypto-hockey-frontend
```

For the full stack see `docker-compose.yml` at the repo root.

## Telegram

This is a Mini App. In production the bot's WebApp button opens it with `?matchId=...` appended; we read that from `window.location.hash`.

## WebSocket client

`EngineClient` connects to `VITE_ENGINE_WS_URL` and authenticates with `initData` on open. On unexpected close it retries with exponential backoff: 1 s, 2 s, 4 s … capped at 30 s, up to 5 attempts. Calling `client.close()` stops reconnection and fires `onClose` handlers immediately.

## Win/loss display

`ResultScreen` determines outcome via `winnerSlot` (`"A"` or `"B"`) from the server's `MATCH_END` message, not `winnerUserId`. This works correctly for all end reasons including forfeit, where score comparison is meaningless.
