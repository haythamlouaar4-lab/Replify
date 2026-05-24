# VipGoPay 🎮

A full-stack Algerian gaming store management app. Store owners can manage inventory, chat with customers via AI (Gemini), process orders, configure real integrations (WhatsApp Business, Telegram, Instagram, Email), and track loyalty tiers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/vipgopay run dev` — run the Vite frontend (port 18263, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `GEMINI_API_KEY` — for AI chat (Gemini 2.5 Flash/Pro)
- Optional env: `RESEND_API_KEY` — for OTP email delivery in production

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/vipgopay`)
- API: Express 5 (artifact: `artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- AI: Google Gemini API (server-side proxy)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema files (products, orders, store-settings, otp-codes)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/vipgopay/src/App.tsx` — full frontend component (auth, inventory, chat, orders, gaming hub, settings)
- `artifacts/vipgopay/src/communes.ts` — 58 Algerian wilayas with communes
- `artifacts/vipgopay/src/utils/email.ts` — email utils + loyalty tier logic

## Architecture decisions

- Frontend stores integration credentials (WA, TG, IG, Email) in localStorage — they are sent to the server-side `/api/notify` route which calls the real 3rd-party APIs. This keeps API keys off the client while letting each store owner configure their own integrations.
- AI chat uses a server-side proxy to Gemini — the `GEMINI_API_KEY` env var lives only on the server.
- OTP codes in dev mode return `devCode` in the JSON response so they can be tested without a real email service.
- Store settings auto-save to the DB 2 seconds after any change (debounced).
- The app persists all data to both localStorage (instant) and the PostgreSQL backend (durable).

## Product

- **Auth:** Google-style email account picker with simulated "verifying" state
- **Inventory:** Product CRUD with stock management, bulk add, low-stock notifications
- **AI Chat:** Customer info collection → Gemini-powered Darja chat → automatic order creation when customer confirms
- **Orders:** List with dashboard stats, filter by status, confirm/cancel, WhatsApp/Messenger/IG share links, CSV export
- **Gaming Hub:** Revenue wallet, loyalty tier progression (Bronze→Diamond), quick recharge shortcuts, 2FA OTP for order confirmation
- **Settings:** Store config, real integrations setup (WA Business/Telegram/Instagram/Email), 58-wilaya shipping rates, notification preferences, webhook URL

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The AI chat requires `GEMINI_API_KEY` in the server env — without it the chat returns a 503 error.
- OTP email delivery in production requires `RESEND_API_KEY`; in dev mode the code is returned in the API response.
- The `/api/store-settings` endpoint always upserts row id=1 (single-tenant).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
