# Architecture rules

- Keep original task titles unchanged during AI classification and scheduling; AI metadata must not replace the user's task identity.
- Capture browser-local time once per planning request and share it with both the rule engine and AI so they agree on the remaining day.
- Keep today/tomorrow placement in each generated plan rather than persisting relative day labels on tasks, because those labels become stale across dates.
- Reconcile tentative AI periods through the rule engine without saving them as task preferences; the resulting exclusive buckets drive a single task display so time and energy advice cannot diverge.

## Working with Lovable

- This project is also edited in Lovable and synced through GitHub. Only edit files in the repo.
- Never ask for, store, or use Supabase credentials. Never run commands that change the live database.
- For database changes: write a SQL file in supabase/migrations/ (with Row Level Security) and add a note in HANDOFF.md saying "Needs applying via Lovable", with a one-line description.
- For edge functions: edit code in supabase/functions/ and note in HANDOFF.md that it needs deploying.
- Don't change Lovable-managed config files unless I ask.
- Don't commit or push; leave that to me.
