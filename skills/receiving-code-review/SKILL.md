---
name: receiving-code-review
description: Evaluate code review feedback with technical rigor before acting on it - restate, verify against the codebase, push back with reasons when it is wrong, clarify unclear items first, and implement one item at a time. Use when receiving review comments from the user, a reviewer agent, a bot, or a GitHub PR, especially when feedback seems unclear, conflicting, or technically questionable.
license: MIT
metadata:
  origin: ECC direct-port adaptation
---

# Receiving Code Review

Review feedback is a claim about the code, not an order. Verify it before
implementing it. Technical correctness beats social comfort.

## When to Activate

- Review comments arrive from the user, a teammate, a reviewer agent (`code-reviewer`, `security-reviewer`, language reviewers), a bot, or a GitHub PR
- Output from `/code-review`, `/review-pr`, `orch-review`, or `santa-method` needs acting on
- Feedback is unclear, conflicts with earlier decisions, or looks wrong for this stack

## How It Works

```text
1. READ       the complete feedback without reacting
2. UNDERSTAND restate each item in your own words, or ask
3. VERIFY     check it against the actual codebase
4. EVALUATE   is it technically sound for THIS codebase?
5. RESPOND    technical acknowledgment or reasoned pushback
6. IMPLEMENT  one item at a time, testing each
```

### Clarify Before Implementing Anything

If any item is unclear, stop and ask about it before implementing any of
the others. Items are often related, and a partial understanding produces a
wrong implementation.

```text
User: "Fix 1-6"
You understand 1, 2, 3, 6 but not 4 and 5.

Wrong: implement 1, 2, 3, 6 now and ask about 4, 5 later
Right: "I understand 1, 2, 3 and 6. I need clarification on 4 and 5 before I start."
```

### Weigh the Source

| Source | Stance |
|--------|--------|
| The user | Trusted. Implement once understood; still ask if scope is unclear. |
| External reviewers, agents, bots | Skeptical but careful. Check every item before acting. |

For external feedback, check before implementing:

1. Is it technically correct for this codebase and stack?
2. Does it break existing behavior?
3. Is there a reason the current implementation is the way it is? (`git log -L`, `git blame`)
4. Does it hold on all supported platforms and versions?
5. Does the reviewer have the full context?
6. Does it conflict with a decision the user already made? If so, stop and ask the user.

If you cannot verify an item, say so: "I can't verify this without X.
Should I investigate, ask, or proceed?"

### YAGNI Check

When a reviewer asks to "implement this properly" (metrics, caching,
pagination, configurability), check whether anything uses it first:

```bash
rg -n "trackMetrics|/api/metrics" --type ts
```

Unused: "Nothing calls this endpoint. Remove it instead (YAGNI)?" Used: then
implement it properly.

### Implementation Order

1. Clarify everything unclear first
2. Blocking issues (breakage, security)
3. Simple fixes (typos, imports, naming)
4. Complex fixes (refactors, logic changes)
5. Test after each one; check for regressions at the end

### When to Push Back

- The suggestion breaks existing functionality
- The reviewer lacks context (platform targets, legacy constraints, prior decisions)
- It adds an unused feature (YAGNI)
- It is technically wrong for this stack
- It conflicts with the user's architectural decisions

Push back with technical reasoning, specific questions, and references to
working code or tests - not defensiveness. Bring the user in when the
disagreement is architectural.

## Examples

**Technical verification instead of agreement:**

```text
Reviewer: "Remove the legacy code path."
Response: "Checked: the build target is macOS 10.15+, and the replacement API
needs 13+. The legacy path is still required. It does have the wrong bundle
ID, though. Fix that, or drop pre-13 support?"
```

**YAGNI:**

```text
Reviewer: "Add proper metrics tracking with a database, date filters, and CSV export."
Response: "Searched the codebase: nothing calls this endpoint. Remove it instead?
Or is there a caller I'm missing?"
```

**Acknowledging correct feedback:**

```text
"Fixed: the retry loop now caps at 5 attempts (src/sync.ts:88)."
"Good catch: the cache key omitted the locale. Fixed in cache.ts and added a test."
```

**Correcting your own pushback:**

```text
"You were right. I checked the call sites and the null case is reachable from
the webhook path. Adding the guard now."
```

**Replying on GitHub:** answer inline review comments in their thread, not as
a top-level PR comment:

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body="Fixed in abc123: ..."
```

## Anti-Patterns

| Mistake | Fix |
|---------|-----|
| "You're absolutely right!" / "Great point!" | State the technical requirement, or just fix it |
| "Thanks for catching that!" | Say what changed and where; the fix shows you heard it |
| Implementing before verifying | Check it against the codebase first |
| Batch-applying every item, then testing | One at a time, test each |
| Assuming the reviewer is right | Check whether it breaks things |
| Avoiding pushback to keep the peace | Technical correctness over comfort |
| Implementing the clear items, deferring the unclear | Clarify everything first |
| Long apologies after being wrong | State the correction and move on |

## Related Skills

- `code-review` and `security-review` - the producing side of a review
- `santa-method` - adversarial dual review before shipping
- `verification-before-completion` - evidence before saying a fix is done
- `systematic-debugging` - when a review item points at a real bug you don't yet understand

## Attribution

Adapted from the `receiving-code-review` skill in [obra/superpowers](https://github.com/obra/superpowers)
(MIT License, copyright 2025 Jesse Vincent).
