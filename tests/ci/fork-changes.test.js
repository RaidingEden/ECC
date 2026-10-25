/**
 * Tests for scripts/ci/check-fork-changes.js.
 *
 * Run with: node tests/ci/fork-changes.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { findUnlogged, isLogged } = require('../../scripts/ci/check-fork-changes');

const checkerPath = path.join(__dirname, '..', '..', 'scripts', 'ci', 'check-fork-changes.js');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function commit(cwd, file, subject, content = `${subject}\n`) {
  fs.writeFileSync(path.join(cwd, file), content);
  git(cwd, ['add', '-A']);
  git(cwd, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-q', '-m', subject]);
}

function withRepo(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fork-changes-test-'));
  try {
    git(dir, ['init', '-q']);
    commit(dir, 'base.txt', 'chore: upstream base');
    git(dir, ['branch', 'upstream-main']);
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runChecker(dir) {
  return spawnSync('node', [checkerPath, '--base', 'upstream-main', '--root', dir], { encoding: 'utf8' });
}

let passed = 0;
let failed = 0;
const record = ok => { if (ok) passed += 1; else failed += 1; };

console.log('\n=== Testing check-fork-changes.js ===\n');

record(test('a squash-merged commit is logged by its PR number', () => {
  assert.ok(isLogged({ sha: 'abc', subject: 'feat: add thing (#12)' }, '| [#12](https://example.test/pull/12) |'));
}));

record(test('a PR number does not match a longer number', () => {
  assert.ok(!isLogged({ sha: 'abc', subject: 'feat: add thing (#1)' }, 'see #12 and #100'));
}));

record(test('a direct commit is logged by its subject', () => {
  assert.ok(isLogged({ sha: 'abc', subject: 'feat: add IT kit' }, '| 2026-10-23 | feat: add IT kit | `abc` |'));
}));

record(test('a pre-merge commit matches the subject its PR row will carry', () => {
  assert.ok(isLogged({ sha: 'abc', subject: 'docs: explain fork' }, '| docs: explain fork | [#2](x) |'));
}));

record(test('findUnlogged returns only the commits the doc omits', () => {
  const commits = [{ sha: 'a', subject: 'feat: one (#1)' }, { sha: 'b', subject: 'feat: two' }];
  assert.deepStrictEqual(findUnlogged(commits, '[#1](x)').map(c => c.sha), ['b']);
}));

record(test('passes when every fork-only commit is logged', () => withRepo(dir => {
  commit(dir, 'a.txt', 'feat: fork feature');
  commit(dir, 'FORK.md', 'docs: add fork log', '| feat: fork feature |\n| docs: add fork log |\n');
  const result = runChecker(dir);
  assert.strictEqual(result.status, 0, result.stderr);
  assert.match(result.stdout, /logs all 2 fork-only commit/);
})));

record(test('fails and names the commit missing from FORK.md', () => withRepo(dir => {
  commit(dir, 'FORK.md', 'docs: add fork log', '| docs: add fork log |\n');
  commit(dir, 'b.txt', 'feat: undocumented change');
  const result = runChecker(dir);
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /feat: undocumented change/);
})));

record(test('skips instead of failing when the base ref is missing', () => withRepo(dir => {
  const result = spawnSync('node', [checkerPath, '--base', 'no-such-ref', '--root', dir], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.match(result.stdout, /skipped/);
})));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}\n`);

if (failed > 0) {
  process.exit(1);
}
