# Samvaad — Real-Time Chat App (MERN + Socket.io)

Some Features:

- 🌟 Tech stack: MERN + Socket.io
- 🎃 Authentication && Authorization with JWT (httpOnly cookies)
- 👾 Real-time messaging with Socket.io
- 🚀 Online user status (Socket.io and React Context)

## Architecture

```
Vercel (frontend)                      Render (backend)
┌─────────────────────┐   /api/* rewrite   ┌──────────────────────┐
│ React + Vite SPA    │ ──────────────────▶│ Express API + Socket │──▶ MongoDB Atlas
│ samvaad.vercel.app  │                    │ samvaad-9me6.onrender│
└─────────────────────┘                    └──────────────────────┘
        │                                          ▲
        └──── WebSocket (direct, no proxy) ────────┘
```

- **REST calls** (`/api/...`) stay relative and are proxied by a Vercel rewrite
  to Render — so the JWT cookie remains first-party and works in every browser.
- **Socket.io** connects directly to the Render backend (`VITE_SOCKET_URL`),
  because WebSockets can't be proxied through Vercel.

## Local development

Backend (from repo root):

```shell
npm install
npm run server        # runs on PORT from .env (default 5000)
```

Frontend (separate terminal):

```shell
npm install --prefix frontend
npm run dev --prefix frontend   # Vite on :3000, proxies /api to :5000
```

> macOS note: AirPlay Receiver listens on port 5000. Either disable it in
> System Settings → General → AirDrop & Handoff, or set `PORT=5050` in `.env`.

### Setup .env (repo root, gitignored)

```js
PORT=5000
MONGO_DB_URI=...
JWT_SECRET=...
NODE_ENV=development
```

## Deployment

### Backend → Render

- **Root directory:** repo root
- **Build command:** `npm run build` (just installs deps — frontend is deployed separately)
- **Start command:** `npm start`
- **Environment:** `MONGO_DB_URI`, `JWT_SECRET`, `NODE_ENV=production` (Render also injects `PORT`)

### Frontend → Vercel

- **Root directory:** `frontend`
- **Framework preset:** Vite (build `npm run build`, output `dist`)
- **Environment variable:** `VITE_SOCKET_URL=https://samvaad-9me6.onrender.com`

Routing/rewrites are handled by `frontend/vercel.json`.
