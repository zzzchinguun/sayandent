# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> Next.js 16 + React 19 + Tailwind v4. APIs and conventions have changed — consult `node_modules/next/dist/docs/` before assuming behavior from older Next.js versions.

## Commands

- `npm run dev` — clears `.next` then starts the dev server
- `npm run build` / `npm start`
- `npm run lint` — flat-config ESLint (`eslint.config.mjs`)
- DB migrations live in [src/lib/db/migrations/](src/lib/db/migrations/) as raw `.sql`. Seed/util scripts run with `tsx`, e.g. `npx tsx src/lib/db/seed.ts`.

No test runner is configured.

## Architecture

**Dual routing tree under `src/app`.** Two parallel sub-trees, dispatched by [src/middleware.ts](src/middleware.ts):
- `[locale]/` — public marketing site, wrapped by `next-intl`. Locales are `mn` (default) and `en`, defined in [src/lib/i18n/config.ts](src/lib/i18n/config.ts); `localePrefix: 'as-needed'` so `mn` URLs are unprefixed. Translations in [messages/](messages/) loaded via [src/lib/i18n/request.ts](src/lib/i18n/request.ts) (wired through `next.config.ts` with `createNextIntlPlugin`).
- `admin/` — auth-gated dashboard. Middleware checks an `admin_token` cookie and redirects to `/admin/login` if missing. Admin routes are deliberately **outside** the `[locale]` segment so i18n middleware does not touch them.

The middleware `matcher` excludes `api`, `_next`, `_vercel`, and files with extensions, so API routes under [src/app/api/](src/app/api/) bypass both i18n and the auth redirect — API auth must be enforced inside the route handlers using helpers in [src/lib/auth/](src/lib/auth/) (`jwt.ts`, `middleware.ts`, `password.ts` — bcryptjs + jose JWTs).

**Database.** Direct Postgres via `pg` Pool, singleton-cached on `globalThis` in [src/lib/db/client.ts](src/lib/db/client.ts). Use the `query` / `queryOne` / `execute` helpers — there is no ORM. `DATABASE_URL` is required.

**Domains exposed via API.** [src/app/api/](src/app/api/) groups: `admin`, `appointments`, `auth`, `contact`, `faqs`, `services`, `staff`, `testimonials`. Validation schemas live in [src/lib/validations/](src/lib/validations/) (zod). Email sending uses Resend in [src/lib/email/](src/lib/email/).

**Frontend stack.** Tailwind v4 (PostCSS plugin, no `tailwind.config`), framer-motion + gsap for animation, `@react-three/fiber` + drei + three for 3D models in [public/models/](public/models/), embla-carousel, react-hook-form + zod resolvers.

## Conventions to preserve

- When adding a public page, put it under `src/app/[locale]/` and add keys to **both** `messages/en.json` and `messages/mn.json` — `mn` is the default and must always be complete.
- When adding an admin page, put it under `src/app/admin/` (not `[locale]`) so middleware treats it as auth-gated, not localized.
- New API routes must enforce auth themselves if they touch admin data — middleware does not cover `/api/*`.
- Schema changes go in a new numbered file under [src/lib/db/migrations/](src/lib/db/migrations/); apply manually.
