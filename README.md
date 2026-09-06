# iballpassyou

Mobile-first, multi-group casual football stats. Pick who showed up, record goals/assists and the result, see the group-local table, and copy the receipts back to WhatsApp.

## Local setup

Requires Node 22+ and a Supabase project. Copy `.env.example` to `.env.local`, add the project URL and anon key, then:

```bash
npm install
npm run dev
```

Without Supabase variables the application deliberately runs against representative demo data, so every read route and the complete session-entry interaction can be reviewed locally. Production writes require Supabase.

## Database

Install the Supabase CLI, start its local stack, and apply the migration:

```bash
supabase start
supabase db reset
psql "$LOCAL_DATABASE_URL" -f supabase/tests/database.sql
```

The schema stores only raw attendance, team assignment, goals, assists, and set-win facts. Composite foreign keys make cross-group relationships impossible. RLS is enabled on every application table; anonymous roles have no raw-table reads. Public Explore, public-group, and unlisted share-token access use narrow `security definer` RPCs. `create_group(jsonb)` and `save_session(jsonb)` are the only aggregate write commands and each runs as one PostgreSQL transaction. Every server action authenticates again through Supabase/RLS.

ISO weekday numbering is used everywhere: Monday `1` through Sunday `7`. Session timestamps are `timestamptz`; calendar boundaries and local form values use the group's IANA timezone.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The E2E suite starts the production server from `playwright.config.ts`. Database security assertions live in `supabase/tests/database.sql` and require the local Supabase stack.

## Import SpartanStats

The predecessor uses global `players`, date-unique `sessions`, and per-session `stats`; later migrations add goal events and goalkeeper details. The importer intentionally brings only V1 facts: players, sessions, attendance, goals, and assists. Unknown historical winners receive no win bonus.

Set the server-only `SPARTAN_*` and destination service-role variables, then reconcile without writes:

```bash
npm run import:spartan -- --dry-run
npm run import:spartan
```

Stable UUIDs make every entity idempotent. The command prints source/destination player, session, appearance, goal, and assist totals and fails if they do not reconcile. The imported group is private unless `SPARTAN_GROUP_VISIBILITY=public`.

## Deployment

Apply `supabase/migrations` through CI or `supabase db push`, configure the public Supabase variables and `NEXT_PUBLIC_SITE_URL` on the Next.js host, and keep `SUPABASE_SERVICE_ROLE_KEY` server-only (it is used only by the import CLI). Configure the Auth site URL and `/auth/callback` redirect in Supabase.

## Architecture

- `src/app`: App Router pages, public/share surfaces, auth callback, and thin server actions.
- `src/components`: mobile interaction and table primitives; client components are limited to forms/copy controls.
- `src/lib`: rating, ranking, timezone, roster parsing, Supabase clients, and the server read layer.
- `supabase/migrations`: relational schema, tenant constraints, RLS, transactional commands, and narrow read APIs.
- `scripts/import-spartan.ts`: dry-run capable predecessor migration.

Intentionally deferred: global rankings, player identities/accounts, goal events, analytics, chat/social features, schedule-specific tables, automatic team balancing, and every other league-management feature outside the brief.
