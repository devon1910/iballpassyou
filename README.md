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
- Player trophy cabinets with Man of the Match medal counts, monthly MVP trophy counts, and expandable award history.
- Personal bests for each session format, including the record-setting session's points, goals, assists, and date.
- Post-save session honours and celebrations for new personal bests, matched records, and first-session benchmarks.
- Branded achievement images with a preview, a choice of personal best to feature, native image sharing where supported, and PNG downloads.
- Leaderboard image sharing for the selected period, with ranks, goals, assists, ratings, and a snapshot date; larger tables split into cards of ten players.
- Helpful loading overlays, active navigation states, inline explanations, date/time pickers, and reduced-motion support.
- A friendly feedback form for suggestions, questions, and error reports.

## Product principles

The app records facts rather than inventing them. Unknown winners do not receive bonuses, team assignments remain optional until they are known, and historical records are imported without fabricating goal events or assists. Every group is isolated from every other group at the database level.

## Achievements and sharing

Achievements use the existing rating: **4 points per goal, 2 per assist, and 1 for a session win**. A win bonus applies only when there is a unique winning team.

- **Man of the Match:** the highest positive rating in a session earns a medal. Players tied at the top share the award.
- **Monthly MVP:** the highest positive total rating in a completed calendar month earns a trophy. Month boundaries follow the group's timezone, ties share the award, and the current month remains open.
- **Personal best:** a player's highest session rating within each format: no teams, fixed teams, or set play. The first session establishes a benchmark; later sessions can beat or match it. Profile cards retain the first session that achieved the highest score.

Both historical and newly logged sessions count automatically. Honours and personal bests are calculated from stored session stats, so corrections, deletions, and historical imports update the results without a backfill job, scheduled task, or separate award database. Historical awards reflect the recorded ratings rather than any manually selected winners from the past.

**Share player achievements** opens a portrait graphic featuring the player's name, group, medal and trophy counts, and selected personal best with goals, assists, points, and date. Players with records in multiple formats can choose which to feature. The browser generates a **1080 × 1440 PNG** using Canvas and local fonts; no AI image service or image storage is required. Supported browsers can share the image file with the profile link in the accompanying text. Download and copy-link options are available for posting manually.

**Share leaderboard** uses the same preview and PNG-sharing flow for the selected period. Each card includes the group, calendar period, snapshot date, and up to ten players with their ranks, goals, assists, and ratings. A card selector includes every player in larger groups, preserving tied ranks across cards. Admin shares link to the public or private-share leaderboard rather than an admin-only page. Admin text copying and session text-sharing buttons remain available.

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
- `src/components`: focused interaction primitives for forms, rosters, sessions, rankings, calendars, player honours, achievement sharing, feedback, and navigation.
- `src/lib`: domain logic, rankings, achievement calculations, Canvas image rendering, formatting, timezone handling, data reads, and Supabase clients.
- `supabase/migrations`: relational schema, constraints, RLS policies, transactional commands, and public read APIs.
- `scripts/import-spartan.ts`: repeatable historical data import.

## Deliberately out of scope

Global rankings, player accounts, analytics, chat, social feeds, automatic team balancing, and full league-management features are intentionally deferred so casual match recording stays quick and human.
