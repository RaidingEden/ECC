---
name: systematic-debugging
description: Root-cause debugging in four phases - investigate, compare against known-good code, test one hypothesis, repair the source. Use when a bug, failing test, broken build, flaky test, or regression is not yet understood, before proposing a fix, and especially after an attempted fix has failed.
license: MIT
metadata:
  origin: ECC direct-port adaptation
---

# Systematic Debugging

Random fixes waste time and create new bugs. Symptom fixes hide the real
problem until it comes back somewhere worse.

```text
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If Phase 1 is not done, do not propose a fix.

## When to Activate

- Test failures, build failures, CI-only failures
- Bugs in production or reported by users
- Unexpected behavior, flaky tests, performance regressions
- Integration issues across services, scripts, or build stages
- **Especially** when under time pressure, when "one quick fix" looks obvious, when a previous fix did not work, or when you do not fully understand the issue

Simple bugs have root causes too, and the process is fast for them.

## How It Works

Complete each phase before starting the next.

| Phase | Key activities | Done when |
|-------|----------------|-----------|
| 1. Root cause | Read errors, reproduce, check changes, instrument boundaries, trace data | You can say WHAT breaks and WHY |
| 2. Pattern | Find working examples, compare, list differences | Differences identified |
| 3. Hypothesis | One theory, smallest test | Confirmed, or a new hypothesis |
| 4. Fix | Failing test, single fix, verify | Bug resolved, no regressions |

### Phase 1: Root Cause Investigation

1. **Read the error completely.** Full stack trace, line numbers, file paths, error codes, warnings. The answer is often in the message.
2. **Reproduce consistently.** Exact steps, every time. If it is not reproducible, gather more data instead of guessing.
3. **Check recent changes.** `git diff`, recent commits, new dependencies, config and environment differences.
4. **Instrument component boundaries** in multi-layer systems (CI -> build -> signing, API -> service -> database). Log what enters and exits each layer, run once, and let the evidence show *which* layer fails before investigating it.
5. **Trace the data flow** when the error is deep in a call stack: where did the bad value originate, and what called this with it? Fix at the source, not where it surfaces. See [references/root-cause-tracing.md](references/root-cause-tracing.md).

### Phase 2: Pattern Analysis

1. Find similar code in the same codebase that works.
2. If you are implementing a known pattern, read the reference implementation completely - do not skim.
3. List every difference between working and broken, however small. Do not assume "that can't matter."
4. Identify the dependencies, settings, and assumptions the broken code relies on.

### Phase 3: Hypothesis and Testing

1. State one hypothesis: "I think X is the root cause because Y." Write it down.
2. Make the smallest change that tests it - one variable at a time.
3. Worked -> Phase 4. Did not work -> form a *new* hypothesis; do not stack more fixes on top.
4. If you do not know, say "I don't understand X" and research or ask. Do not pretend.

### Phase 4: Implementation

1. **Write a failing test** that reproduces the bug (automated if possible, a one-off script if not) before fixing. Use `tdd-workflow`.
2. **Make one fix** addressing the root cause. No "while I'm here" changes, no bundled refactors.
3. **Verify:** the new test passes, nothing else broke, and the original symptom is gone. Use `verification-before-completion` before claiming success.
4. **If the fix did not work:** count your attempts. Fewer than 3: return to Phase 1 with the new information. **3 or more: stop and question the architecture.**

### When 3+ Fixes Have Failed

Signs of an architectural problem rather than a bad hypothesis:

- Each fix reveals new shared state or coupling somewhere else
- Each fix creates a new symptom elsewhere
- A proper fix seems to need a "massive refactor"

Stop and discuss with the user before attempting fix #4: is this pattern
fundamentally sound, or are we continuing out of inertia?

### When the Investigation Finds "No Root Cause"

If the issue really is environmental, timing-dependent, or external:
document what you investigated, add appropriate handling (retry, timeout,
clear error message), and add logging for next time. Most "no root cause"
conclusions are incomplete investigations, so be sure first.

## Examples

**Instrumenting a multi-layer failure (secret not reaching code signing):**

```bash
# Layer 1: workflow
echo "IDENTITY in workflow: $([ -n "${IDENTITY:-}" ] && echo SET || echo UNSET)"
# Layer 2: build script
printenv IDENTITY >/dev/null 2>&1 && echo "IDENTITY in build env" || echo "IDENTITY missing in build env"
# Layer 3: signing tool state
security find-identity -v
```

Result: set in the workflow, missing in the build script, so the bug is in
how the workflow passes env to the build step, not in signing.

**Writing the hypothesis down:**

```text
Hypothesis: the cache key omits the locale, so the first locale's response
is served to everyone. Test: request /home as en then fr with the cache
cold, and compare response bodies. One change only.
```

## Anti-Patterns

If you catch yourself thinking any of these, stop and return to Phase 1:

| Thought | Reality |
|---------|---------|
| "Quick fix for now, investigate later" | The first fix sets the pattern. Investigate now. |
| "Just try changing X and see" | That's guessing. Form a hypothesis first. |
| "Change several things, then run tests" | You can't tell what worked, and you add new bugs. |
| "Skip the test, I'll check by hand" | Untested fixes don't stick. |
| "It's probably X" | Seeing a symptom is not understanding the cause. |
| "The reference is long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it all. |
| "One more fix attempt" (after 2+ failures) | 3+ failures means an architecture problem. |
| "Emergency, no time for process" | Systematic is faster than thrashing. |

Signals from the user that you are off track: "Is that not happening?"
(you assumed without checking), "Will it show us...?" (you should have
gathered evidence), "Stop guessing", or a frustrated "We're stuck?"

## Supporting Techniques

- [references/root-cause-tracing.md](references/root-cause-tracing.md) - trace a bad value backward through the call chain to its origin
- [references/defense-in-depth.md](references/defense-in-depth.md) - after the fix, validate at every layer so the bug becomes impossible
- [references/condition-based-waiting.md](references/condition-based-waiting.md) - replace arbitrary sleeps in flaky tests with condition polling

## Related Skills

- `tdd-workflow` - write the failing regression test in Phase 4
- `verification-before-completion` - evidence before claiming the bug is fixed
- `agent-introspection-debugging` - when the thing failing is an agent run itself
- `ai-regression-testing` - keep the fixed bug from coming back

## Attribution

Adapted from the `systematic-debugging` skill in [obra/superpowers](https://github.com/obra/superpowers)
(MIT License, copyright 2025 Jesse Vincent), including its root-cause-tracing,
defense-in-depth, and condition-based-waiting techniques.
