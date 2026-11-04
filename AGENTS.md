# Architecture rules

- Keep original task titles unchanged during AI classification and scheduling; AI metadata must not replace the user's task identity.
- Capture browser-local time once per planning request and share it with both the rule engine and AI so they agree on the remaining day.
- Keep today/tomorrow placement in each generated plan rather than persisting relative day labels on tasks, because those labels become stale across dates.
- Reconcile tentative AI periods through the rule engine without saving them as task preferences; the resulting exclusive buckets drive a single task display so time and energy advice cannot diverge.

## Working with Lovable

- This project is also edited in Lovable and synced through GitHub. Only edit files in the repo.
- Never print, commit, or store database passwords, access tokens, service-role keys, or other Supabase secrets. Browser/CLI authentication may be used without exposing its credentials.
- Database schema changes must be versioned in `supabase/migrations/` and include user-scoped Row Level Security where applicable.
- Codex may inspect and deploy reviewed migrations and edge functions through the authenticated Supabase CLI when the user explicitly requests it. Require explicit confirmation before destructive production operations or editing production records.
- Keep generated Supabase TypeScript types synchronized after schema changes.
- When this project uses an external Supabase backend, note unapplied migrations and undeployed functions in HANDOFF.md without requiring Lovable to be the deployment gateway.
- For edge functions: edit code in supabase/functions/ and note in HANDOFF.md that it needs deploying.
- Don't change Lovable-managed config files unless I ask.
- Don't commit or push; leave that to me.
