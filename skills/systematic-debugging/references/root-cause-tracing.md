# Root Cause Tracing

Bugs often surface deep in a call stack: `git init` in the wrong directory, a
file written to the wrong place, a database opened with the wrong path. The
instinct is to fix where the error appears. That treats the symptom.

**Principle:** trace backward through the call chain to the original
trigger, fix it there, then add defense in depth.

## When to Use

- The error happens deep in execution, not at the entry point
- The stack trace shows a long call chain
- It is unclear where the invalid data came from
- You need to find which test or caller triggers the problem

## The Process

1. **Observe the symptom**

   ```text
   Error: git init failed in ~/project/packages/core
   ```

2. **Find the immediate cause** - the code that directly fails:

   ```typescript
   await execFileAsync('git', ['init'], { cwd: projectDir });
   ```

3. **Ask what called it, and with what value**

   ```text
   WorktreeManager.createSessionWorktree(projectDir, sessionId)
     <- Session.initializeWorkspace()
     <- Session.create()
     <- test calling Project.create()
   projectDir = ''   (empty cwd resolves to process.cwd(): the source tree)
   ```

4. **Keep tracing up until you reach the source**

   ```typescript
   const context = setupCoreTest();          // returns { tempDir: '' } until beforeEach runs
   Project.create('name', context.tempDir);  // read at top level, before beforeEach
   ```

5. **Fix at the source.** Here: make `tempDir` a getter that throws if read before `beforeEach`. Then add validation at the layers in between (see `defense-in-depth.md`).

## When You Cannot Trace by Reading

Log right *before* the dangerous operation, with context and a stack:

```typescript
async function gitInit(directory: string) {
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack: new Error().stack,
  });
  await execFileAsync('git', ['init'], { cwd: directory });
}
```

```bash
npm test 2>&1 | grep 'DEBUG git init'
```

- In tests, use `console.error` (stderr); an app logger may be silenced
- Log before the operation, not after it fails
- Include directory, cwd, relevant env vars, and `new Error().stack`
- In the output, look for test file names and repeated parameters

## Finding Which Test Pollutes

When an artifact appears during a test run but you don't know which test
creates it, run the test files one at a time and stop at the first one that
leaves it behind:

```bash
for t in $(find src -name '*.test.ts' | sort); do
  npx vitest run "$t" >/dev/null 2>&1
  if [ -e packages/core/.git ]; then echo "Polluter: $t"; break; fi
done
```

Adapt the check (`packages/core/.git` here) to whatever artifact you are chasing.

## Rule

Never fix only where the error appears. If you can trace one level up, do,
until you reach the source.
