# Tasks
- [x] Unify scheduling and energy recommendations into one consistent plan with each task shown once.
- [x] Verify morning, afternoon, evening, and completion behavior (15 tests; desktop and narrow-screen preview checks).
- [x] Show full task names in task lists and flow results.
- [x] Use local time in rule-based and AI planning; label deferred tasks as tomorrow.
- [x] Verify readability and time-aware planning (11 tests; wide/narrow browser checks; live AI evening advice).- [ ] Explain why each task lands in Do Now / Later / Tomorrow / Set Aside (energy, mood, time of day).
- [ ] Add "Move to Do Now" override on Set Aside tasks: shows "Your choice", survives replan/refresh, expires next local day.
- [ ] Add tasks.override_bucket (NULL|'do_now') and tasks.override_date columns; verify RLS unchanged.
- [ ] Re-verify blank-page report on live site and preview.
