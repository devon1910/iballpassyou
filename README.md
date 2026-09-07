# iBallPassYou

iBallPassYou is a mobile-first football record book for casual groups. It turns the familiar group-chat-to-pitch-to-group-chat routine into a proper, shared record: choose who played, capture the match, and keep a leaderboard everyone can understand.

It is deliberately lightweight. Players do not need accounts, admins do not need league-management software, and the important facts stay close to the people who created them.

## What makes it rich

- Multi-group support, with one admin account able to run several football groups.
- Public leaderboards that anyone can explore, plus private groups and unlisted share links.
- Session logging in three formats: player stats only, fixed two-team results, or flexible multi-team set play.
- Fast roster selection, new-player addition, team assignment shortcuts, reusable team names, and clear unassigned-player feedback.
- Goals, assists, attendance, set wins, and own-goal records.
- Group-local rankings with monthly, previous-month, yearly, and all-time views.
- A match calendar that marks recorded days with football icons and links straight to each session.
- Full leaderboard copying for admins, designed for sharing back to WhatsApp or the group chat.
- Helpful loading overlays, active navigation states, inline explanations, date/time pickers, and reduced-motion support.
- A friendly feedback form for suggestions, questions, and error reports.

## Product principles

The app records facts rather than inventing them. Unknown winners do not receive bonuses, team assignments remain optional until they are known, and historical records are imported without fabricating goal events or assists. Every group is isolated from every other group at the database level.

## Local development

Requires Node 22+ and a Supabase project.

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and provide the public Supabase URL and publishable or anon key. Keep service-role keys server-only. The app can render representative local fallback data when Supabase is not configured, but production reads and writes use Supabase.

## Database and security

The Supabase schema is multi-tenant by design:

- Every player, session, team, and appearance belongs to a group.
- Composite foreign keys prevent cross-group references.
- Row-level security protects every application table.
- Anonymous users receive only the narrow public read APIs needed for public pages.
- Admin reads and writes require an authenticated group owner or admin membership.
- Session saves and group creation run through transactional PostgreSQL commands.
- Public payloads never include private share tokens.

Apply migrations with the Supabase CLI:

```bash
supabase start
supabase db reset
psql "$LOCAL_DATABASE_URL" -f supabase/tests/database.sql
```

Dates are stored as `timestamptz`; display and calendar boundaries use each group’s IANA timezone. Weekdays use ISO numbering, Monday `1` through Sunday `7`.

## Historical data import

`scripts/import-spartan.ts` is a dry-run-capable importer for the historical football records used to seed the first live group. It normalizes agreed player aliases, preserves distinct people with similar names, imports attendance, goals, and assists, and never invents winners or goal-event attribution.

```bash
npm run import:spartan -- --dry-run
npm run import:spartan
```

Stable UUIDs make reruns idempotent. The importer prints source and destination totals and stops if reconciliation fails.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Architecture

- `src/app`: App Router pages, authentication callback, public surfaces, and server actions.
- `src/components`: focused interaction primitives for forms, rosters, sessions, rankings, calendars, feedback, and navigation.
- `src/lib`: domain types, rankings, formatting, timezone handling, data reads, and Supabase clients.
- `supabase/migrations`: relational schema, constraints, RLS policies, transactional commands, and public read APIs.
- `scripts/import-spartan.ts`: repeatable historical data import.

## Deliberately out of scope

Global rankings, player accounts, analytics, chat, social feeds, automatic team balancing, and full league-management features are intentionally deferred so casual match recording stays quick and human.
