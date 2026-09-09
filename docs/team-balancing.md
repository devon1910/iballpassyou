# Team balancing

The input is the complete admin-selected attendance list. No player is omitted or
ranked for participation. `effectiveSkill` currently comes only from the manually
entered 1–5 Skill Level. Historical Rating and its 4/2/1 formula are unchanged.

`src/lib/balance/types.ts` defines the pure optimizer boundary. `scoring.ts` owns
the objective weights, quality thresholds, and search budgets. `optimizer.ts`
enumerates small assignments, respects locks and floor/ceiling team sizes, and
deduplicates equivalent team partitions regardless of labels. Candidate counting
is conservative (labeled splits), so it may switch to the heuristic earlier than
strictly necessary. Ordinary 10- and 12-player two-team rosters use exact search.

Larger rosters use seeded skill-aware restarts and improving swaps, capped by both
passes and a total swap budget. The default seed is stable. This is a bounded best
effort, not an optimality guarantee. Up to 24 distinct near-best candidates are
retained; the UI shows at most three at a time. “Try another” advances through
that pool and reports exhaustion. Secondary positions count as coverage, not
simultaneous assigned roles or formations. No positions are rewritten.

Manual moves and swaps call the same assessment function. Generation locks are
hard constraints; manually moving a pinned player requires explicitly unlocking
them. An admin may accept any quality after editing. Accepted assignments enter
the existing stats/results/session writer without a new team model.

## Database rollout

Apply `supabase/migrations/20260909000000_player_balancing.sql` before deploying
the application. It adds nullable position/Skill Level columns and a default-false
keeper flag. Existing admin RLS applies to reads and edits. Only the authenticated
admin read function adds these fields; public/shared/group-list read models keep
their explicit existing allowlists. Do not replace them with whole-row JSON.

The session RPC wrapper preserves the existing writer, saves newly entered
players' profiles in the same transaction, and preserves idempotent retries.
Its internal writer is not executable by client roles. Existing players' edits
save immediately through their admin-protected player row.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run test:e2e`.
Browser tests use the application's demo mode; they do not prove live Supabase
persistence. They produce a demo build; run `npm run build` again before deploying
with your real environment. On a disposable local Supabase database, apply both migrations and
run `supabase/tests/database.sql` and `supabase/tests/balancing.sql` using psql
with `ON_ERROR_STOP=1`. The latter covers public/shared privacy, tenant isolation,
constraints, new-player metadata persistence, and idempotent session saves.
