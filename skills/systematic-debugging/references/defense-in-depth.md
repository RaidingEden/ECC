# Defense-in-Depth Validation

After fixing a bug caused by invalid data, one validation check feels like
enough. It isn't: other code paths, refactors, and mocks can bypass it.

**Principle:** validate at every layer the data passes through, so the bug
becomes structurally impossible rather than merely fixed.

## The Four Layers

### 1. Entry Point Validation

Reject obviously invalid input at the API boundary.

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ...
}
```

### 2. Business Logic Validation

Make sure the data makes sense for this specific operation.

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ...
}
```

### 3. Environment Guards

Refuse dangerous operations in contexts where they should never happen.

```typescript
async function gitInit(directory: string) {
  if (process.env.NODE_ENV === 'test') {
    const target = normalize(resolve(directory));
    const tmp = normalize(resolve(tmpdir()));
    if (!target.startsWith(tmp)) {
      throw new Error(`Refusing git init outside temp dir during tests: ${directory}`);
    }
  }
  // ...
}
```

### 4. Debug Instrumentation

Capture context for forensics when the other layers somehow miss.

```typescript
logger.debug('About to git init', { directory, cwd: process.cwd(), stack: new Error().stack });
```

## Applying It

1. **Trace the data flow** - where the bad value originates and where it is used
2. **Map every checkpoint** it passes through
3. **Add validation at each layer** - entry, business logic, environment, debug
4. **Test each layer** - bypass layer 1 and confirm layer 2 catches it

In practice all four earn their place: different code paths skip entry
validation, mocks skip business checks, platform edge cases need environment
guards, and debug logging exposes structural misuse.
