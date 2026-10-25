---
name: verification-before-completion
description: Evidence before claims - run the command that proves a claim, read its full output, and only then say work is done, fixed, passing, or complete. Use before any success or completion claim, before committing, pushing, or opening a PR, before moving to the next task, and before reporting a subagent's work as finished.
license: MIT
metadata:
  origin: ECC direct-port adaptation
---

# Verification Before Completion

Claiming work is done without checking is not efficiency; it is a false
report.

```text
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the verification command in this turn, you cannot claim
it passes.

## When to Activate

- About to say anything is done, fixed, working, passing, or complete - in any wording
- Before committing, pushing, opening a PR, or marking a task complete
- Before moving on to the next task in a plan
- When a subagent reports success
- When tempted to write "should work now", "looks good", or "Done!"

This skill is the *claim discipline*. For the full multi-phase quality gate
(build, types, lint, tests, security, diff), run `verification-loop`.

## How It Works

The gate, before any status claim:

```text
1. IDENTIFY  which command proves this claim?
2. RUN       the full command, fresh and complete
3. READ      the full output: exit code, failure counts, warnings
4. VERIFY    does the output confirm the claim?
               no  -> state the actual status, with the evidence
               yes -> state the claim, with the evidence
5. CLAIM     only now
```

### What Each Claim Requires

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test output with 0 failures | A previous run, "should pass" |
| Linter clean | Linter output with 0 errors | A partial check, extrapolation |
| Build succeeds | Build command exits 0 | Lint passing, logs looking fine |
| Bug fixed | The original symptom no longer reproduces | Code changed, assumed fixed |
| Regression test works | Red-green cycle observed | Test passes once |
| Subagent finished | The diff shows the changes, and they check out | The agent says "success" |
| Requirements met | Line-by-line check against the plan | Tests passing |

## Examples

**Tests:**

```text
Good: [ran npm test] [34/34 passing, exit 0] "All 34 tests pass."
Bad:  "Should pass now."
```

**Regression test, red-green proven:**

```text
Good: write test -> run (pass) -> revert the fix -> run (FAILS) -> restore -> run (pass)
Bad:  "I've added a regression test."
```

**Build:**

```text
Good: [ran npm run build] [exit 0] "Build passes."
Bad:  "Lint passed, so it builds."
```

**Requirements:**

```text
Good: re-read the plan -> checklist -> verify each item -> report gaps or completion
Bad:  "Tests pass, phase complete."
```

**Delegated work:**

```text
Good: agent reports success -> git diff -> inspect changes -> run checks -> report actual state
Bad:  relaying the agent's report as fact
```

**Honest partial status:**

```text
"Unit tests pass (112/112). The e2e suite was not run here because it needs
the staging database, so the checkout flow is unverified."
```

## Anti-Patterns

| Excuse | Reality |
|--------|---------|
| "Should work now" | Run the verification. |
| "I'm confident" | Confidence is not evidence. |
| "Just this once" | No exceptions. |
| "Linter passed" | A linter is not a compiler or a test run. |
| "The agent said it succeeded" | Verify independently. |
| "A partial check is enough" | A partial check proves only that part. |
| "I used different words, so it isn't a claim" | Any wording that implies success is a claim. |

Red flags: "should", "probably", "seems to"; expressing satisfaction
("Great!", "Perfect!") before running anything; about to commit or open a PR
unverified.

## Related Skills

- `verification-loop` - the full build/type/lint/test/security/diff gate
- `tdd-workflow` - red-green evidence for new behavior
- `systematic-debugging` - when verification fails and the cause is unclear
- `delivery-gate` - release-level checks before shipping

## Attribution

Adapted from the `verification-before-completion` skill in [obra/superpowers](https://github.com/obra/superpowers)
(MIT License, copyright 2025 Jesse Vincent).
