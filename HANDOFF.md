# Lovable Handoff

Running to-do list for changes that must be applied or deployed through Lovable. Check off an item only after confirming it is live.

## Pending

### Database migrations

All repository migrations through `20261103100000_add_moods_to_daily_logs.sql` are applied to external Supabase project `lemounryblppsiuoljjh`.

### Edge functions

- [x] External Supabase project `lemounryblppsiuoljjh` is connected in Lovable and `LOVABLE_API_KEY` is provisioned.
- [x] `classify-task`, `plan-flow-ai`, and `get-insights` deployed and ACTIVE in external Supabase project `lemounryblppsiuoljjh`.
- [ ] Redeploy `get-insights` so stored UTC timestamps are converted to the browser's local timezone before AI analysis.
- [ ] Redeploy `plan-flow-ai` so the daily check-in note can guide workload and scheduling suggestions.
- [ ] Redeploy `classify-task` so obvious correspondence such as thank-you notes cannot be labeled Deep Work.

### Authentication

- [ ] In Supabase Authentication settings, set Site URL to `https://flowstateenergy.lovable.app` and enable Google with its OAuth client ID and secret. Add `https://lemounryblppsiuoljjh.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud.

## Completed

- None yet.
