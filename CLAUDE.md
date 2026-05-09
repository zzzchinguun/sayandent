# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Next.js 16 + React 19 + Tailwind v4. APIs and conventions have changed — consult `node_modules/next/dist/docs/` before assuming behavior from older Next.js versions.

## Monorepo layout

Two independent npm projects share a single git repo:

- **`frontend/`** — Next.js 16 app (public site + admin dashboard). Deployed to Vercel (rootDirectory = `frontend`).
- **`backend/`** — Express 5 REST API (TypeScript, `tsx watch`). Will be self-hosted alongside Postgres.

Each has its own `package.json`, `node_modules`, `.env`, and `tsconfig.json`. Run `npm install` and commands from within the respective directory.

## Commands

### Frontend (`cd frontend`)
- `npm run dev` — clears `.next` then starts the dev server (port 3000)
- `npm run build` / `npm start`
- `npm run lint` — flat-config ESLint (`eslint.config.mjs`)
- DB seed/util scripts: `npx tsx src/lib/db/seed.ts`

### Backend (`cd backend`)
- `npm run dev` — `tsx watch src/index.ts` (port 4000)
- `npm run build` — `tsc` to `dist/`
- `npm run db:migrate` / `npm run db:seed`

No test runner is configured in either project.

## Architecture

### Frontend routing (dual tree)

Two parallel sub-trees under `frontend/src/app`, dispatched by `src/middleware.ts`:

- **`[locale]/`** — public marketing site, wrapped by `next-intl`. Locales: `mn` (default, unprefixed URLs) and `en`. Translations in `messages/{en,mn}.json`, loaded via `src/lib/i18n/request.ts` (wired through `next.config.ts` with `createNextIntlPlugin`). Locale config in `src/lib/i18n/config.ts`.
- **`admin/`** — auth-gated dashboard. Middleware checks `admin_token` cookie; redirects to `/admin/login` if missing. Admin uses a `(dashboard)` route group for shared layout. Deliberately **outside** `[locale]` so i18n middleware does not touch it.

The middleware `matcher` excludes `api`, `_next`, `_vercel`, and files with extensions — API routes under `src/app/api/` bypass both i18n and auth redirect. API auth must be enforced inside route handlers using helpers in `src/lib/auth/` (bcryptjs + jose JWTs).

### Database

Direct Postgres via `pg` Pool, singleton-cached on `globalThis` in `src/lib/db/client.ts`. Use the `query` / `queryOne` / `execute` helpers — there is no ORM. `DATABASE_URL` env var is required. Migrations are numbered `.sql` files in `src/lib/db/migrations/`; apply manually.

### Backend API

Express 5 app at `backend/src/index.ts`. Routes split into `routes/auth.ts`, `routes/public.ts`, `routes/admin.ts`. Auth middleware in `middleware/auth.ts`. Validation schemas (zod) in `validations/`. Shares the same DB helpers pattern and email (Resend) setup as frontend.

### Frontend stack

Tailwind v4 (PostCSS plugin, **no `tailwind.config`**), framer-motion + gsap for animation, `@react-three/fiber` + drei + three for 3D models in `public/models/`, embla-carousel, react-hook-form + zod resolvers, lucide-react icons.

## Conventions

- Public pages go under `frontend/src/app/[locale]/` — add keys to **both** `messages/en.json` and `messages/mn.json` (`mn` must always be complete).
- Admin pages go under `frontend/src/app/admin/` (not `[locale]`).
- New API routes must enforce auth themselves if they touch admin data — middleware does not cover `/api/*`.
- Schema changes go in a new numbered `.sql` file under `frontend/src/lib/db/migrations/`.
- Backend env vars: see `backend/.env.example` for required config (`DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `PORT`, `CORS_ORIGIN`).
