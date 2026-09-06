# Capacity Connect

Capacity Connect is a professional learning network where trainees build skills, trainers teach, and administrators review account access and learning operations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/prolearn-network run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run bootstrap-admin` — one-time server-side first-admin provisioning
- `pnpm --filter @workspace/scripts run verify-admin -- --email you@example.com` — verify the application profile for an admin email
- Required runtime secrets: `DATABASE_URL` and `SESSION_SECRET`
- The admin bootstrap command additionally requires temporary Replit Secrets `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`, plus `ADMIN_BOOTSTRAP_ENABLED=true`. It never prints or stores the password in source code.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/prolearn-network` — React/Vite Capacity Connect web app and role-aware routes
- `artifacts/api-server/src/routes/auth.ts` — signup, login, admin authorization, trainer approval, and user-management endpoints
- `artifacts/api-server/src/lib/auth.ts` — signed HttpOnly session cookie and server-side profile authorization
- `lib/db/src/schema/index.ts` — application-owned `profiles` table and role/status enums
- `scripts/src/bootstrap-admin.ts` — one-time admin provisioning through Supabase Auth plus the application database

## Architecture decisions

- Supabase Auth is the identity provider; application role and status are read from the server-owned `profiles` table.
- Public signup only accepts `TRAINEE` or `TRAINER`; `ADMIN` is never accepted from browser input.
- Admin routes require an authenticated Supabase user plus `profiles.role = ADMIN` and `profiles.status = APPROVED`.
- The first admin is provisioned by a temporary server-side command, not by a frontend control or a universal password.

## Product

- Trainee learning paths, courses, competency signals, certificates, and professional network
- Trainer workspace with pending-application lifecycle and teaching tools
- Admin control center with live trainer applications, approve/reject/suspend/restore actions, live user directory controls, analytics, competency mapping, announcements, and audit-oriented reporting

## User preferences

- Keep authorization server-side and do not expose administrator credentials.

## Gotchas

- Run the admin bootstrap only after setting the temporary Replit Secrets and `ADMIN_BOOTSTRAP_ENABLED=true`; remove all bootstrap values immediately afterward.
- Supabase email confirmation settings may require the new admin to verify their inbox before password login succeeds.
- Do not promote an existing profile with the bootstrap command; it intentionally refuses if any admin exists or the requested email already has a profile.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
