# Lovable Handoff

Running to-do list for changes that must be applied or deployed through Lovable. Check off an item only after confirming it is live.

## Pending

### Database migrations

- [ ] **Needs applying via Lovable** — `supabase/migrations/20261103090000_add_task_deadlines.sql`: Adds optional local deadline date and time fields to tasks.
- [ ] **Needs applying via Lovable** — `supabase/migrations/20261011090000_add_daily_task_override.sql`: Adds secure, same-day task bucket overrides and user-scoped Row Level Security policies.

### Edge functions

- [ ] `supabase/functions/plan-flow-ai`: Needs deploying so AI planning treats task deadlines as hard constraints.

## Completed

- None yet.
