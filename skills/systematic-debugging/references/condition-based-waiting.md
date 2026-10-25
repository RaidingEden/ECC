# Condition-Based Waiting

Flaky tests often guess at timing with fixed delays. They pass on a fast
machine and fail under load or in CI.

**Principle:** wait for the condition you actually care about, not a guess
at how long it takes.

## When to Use

- Tests contain `setTimeout`, `sleep`, or `time.sleep()` delays
- Tests pass sometimes and fail under load or in parallel
- Tests wait for async work to finish

Do not use it when you are testing timing itself (debounce, throttle,
intervals). Then a fixed delay is correct, but document why.

## Core Pattern

```typescript
// Before: guessing
await new Promise(r => setTimeout(r, 50));
expect(getResult()).toBeDefined();

// After: waiting for the condition
await waitFor(() => getResult() !== undefined, 'result to be set');
expect(getResult()).toBeDefined();
```

## Implementation

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000,
): Promise<T> {
  const start = Date.now();
  while (true) {
    const result = condition();
    if (result) return result;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10));
  }
}
```

Python equivalent:

```python
import time

def wait_for(condition, description, timeout_s=5.0, poll_s=0.01):
    deadline = time.monotonic() + timeout_s
    while True:
        result = condition()
        if result:
            return result
        if time.monotonic() > deadline:
            raise TimeoutError(f"Timeout waiting for {description} after {timeout_s}s")
        time.sleep(poll_s)
```

## Quick Patterns

| Waiting for | Condition |
|-------------|-----------|
| An event | `() => events.find(e => e.type === 'DONE')` |
| A state | `() => machine.state === 'ready'` |
| A count | `() => items.length >= 5` |
| A file | `() => fs.existsSync(path)` |
| A compound condition | `() => obj.ready && obj.value > 10` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Polling every 1ms | Poll about every 10ms |
| No timeout | Always time out, with a message naming the condition |
| Reading state once before the loop | Call the getter inside the loop |

## When a Fixed Delay Is Correct

```typescript
// The tool ticks every 100ms; we need two ticks to see partial output.
await waitForEvent(manager, 'TOOL_STARTED'); // first wait for the trigger
await new Promise(r => setTimeout(r, 200));  // then 2 known ticks, documented
```

Requirements: wait for the triggering condition first, base the delay on a
known interval rather than a guess, and comment why.
