# crypto-hockey-frontend

Telegram Mini App for Crypto Hockey aerohockey matches. Talks WSS to `crypto-hockey-game-engine`.

## Run

```bash
cp .env.example .env # optional
npm install
npm run dev
```

Open the Vite URL with `?matchId=<id>` and the dev mock running (`npm run test:e2e` starts one), or against the real engine via `VITE_ENGINE_WS_URL=wss://engine.example/ws`.

Set `VITE_BOT_API_URL` to the bot's public HTTP base URL so the Home screen can sign users in via `POST /auth/session`.

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

This is a Mini App. In production the bot opens it with `?matchId=...` appended to the
**query string** (Telegram preserves the query but overwrites the URL hash with its own
launch params), and we read `matchId` from `window.location.search`.

When opened **without** a `matchId` (the bot's welcome/sign-in button), the app shows a
`HomeScreen` instead of erroring. From a reply-keyboard `web_app` button it can sign the
user in via `WebApp.sendData(initData)`, which the bot exchanges for an account session.

## WebSocket client

`EngineClient` connects to `VITE_ENGINE_WS_URL` and authenticates with `initData` on open. On unexpected close it retries with exponential backoff: 1 s, 2 s, 4 s … capped at 30 s, up to 5 attempts. Calling `client.close()` stops reconnection and fires `onClose` handlers immediately.

## Win/loss display

`ResultScreen` determines outcome via `winnerSlot` (`"A"` or `"B"`) from the server's `MATCH_END` message, not `winnerUserId`. This works correctly for all end reasons including forfeit, where score comparison is meaningless.
