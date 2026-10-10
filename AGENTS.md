# Architecture rules
- Keep original task titles unchanged during AI classification and scheduling; AI metadata must not replace the user's task identity.
- Capture browser-local time once per planning request and share it with both the rule engine and AI so they agree on the remaining day.
- Keep today/tomorrow placement in each generated plan rather than persisting relative day labels on tasks, because those labels become stale across dates.