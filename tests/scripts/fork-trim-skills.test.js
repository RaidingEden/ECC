/**
 * Tests for scripts/fork-trim-skills.js.
 *
 * Run with: node tests/scripts/fork-trim-skills.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { withFlag, withoutFlag, isFlagged } = require('../../scripts/fork-trim-skills');

const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'fork-trim-skills.js');

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

function withRepo(list, files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fork-trim-test-'));
  try {
    fs.mkdirSync(path.join(dir, 'config'));
    fs.writeFileSync(path.join(dir, 'config', 'fork-skill-trim.json'), JSON.stringify(list));
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function run(dir, ...args) {
  return spawnSync('node', [scriptPath, '--root', dir, ...args], { encoding: 'utf8' });
}

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');

const SKILL = '---\nname: demo\ndescription: Demo skill.\n---\n\n# Demo\n';
const FOLDED_SKILL = '---\nname: folded\ndescription: >-\n  Long folded\n  description.\n---\n\n# Folded\n';

let passed = 0;
let failed = 0;
const record = ok => { if (ok) passed += 1; else failed += 1; };

console.log('\n=== Testing fork-trim-skills.js ===\n');

record(test('adds the flag as the last frontmatter line', () => {
  assert.strictEqual(
    withFlag(SKILL),
    '---\nname: demo\ndescription: Demo skill.\ndisable-model-invocation: true\n---\n\n# Demo\n',
  );
}));

record(test('keeps a folded description intact', () => {
  const updated = withFlag(FOLDED_SKILL);
  assert.ok(updated.includes('description: >-\n  Long folded\n  description.\ndisable-model-invocation: true\n---'));
}));

record(test('preserves CRLF line endings', () => {
  const updated = withFlag(SKILL.replace(/\n/g, '\r\n'));
  assert.ok(updated.includes('Demo skill.\r\ndisable-model-invocation: true\r\n---\r\n'));
  assert.ok(!/[^\r]\n/.test(updated), 'no bare LF should be introduced');
}));

record(test('turns an existing false flag into true', () => {
  const updated = withFlag('---\ndescription: x\ndisable-model-invocation: false\n---\nbody\n');
  assert.strictEqual(updated, '---\ndescription: x\ndisable-model-invocation: true\n---\nbody\n');
}));

record(test('returns null when there is no frontmatter', () => {
  assert.strictEqual(withFlag('# No frontmatter\n'), null);
}));

record(test('withoutFlag undoes withFlag exactly', () => {
  assert.strictEqual(withoutFlag(withFlag(SKILL)), SKILL);
  assert.strictEqual(withoutFlag(withFlag(FOLDED_SKILL)), FOLDED_SKILL);
}));

record(test('isFlagged only counts the flag inside frontmatter', () => {
  assert.strictEqual(isFlagged(withFlag(SKILL)), true);
  assert.strictEqual(isFlagged(`${SKILL}\ndisable-model-invocation: true\n`), false);
}));

record(test('apply flags listed skills and commands, leaves others alone, and is idempotent', () => {
  const files = {
    'skills/demo/SKILL.md': SKILL,
    'skills/kept/SKILL.md': SKILL,
    'commands/old.md': '---\ndescription: Old command\n---\n\nBody\n',
  };
  withRepo({ skills: ['demo'], commands: ['old'] }, files, dir => {
    const first = run(dir);
    assert.strictEqual(first.status, 0, first.stderr);
    assert.match(first.stdout, /Flagged 2 file/);
    assert.ok(isFlagged(read(dir, 'skills/demo/SKILL.md')));
    assert.ok(isFlagged(read(dir, 'commands/old.md')));
    assert.strictEqual(read(dir, 'skills/kept/SKILL.md'), SKILL);

    const second = run(dir);
    assert.strictEqual(second.status, 0, second.stderr);
    assert.match(second.stdout, /Flagged 0 file\(s\); 2 already flagged/);
  });
}));

record(test('apply and --check fail on a listed skill that no longer exists', () => {
  withRepo({ skills: ['gone'], commands: [] }, {}, dir => {
    assert.strictEqual(run(dir).status, 1);
    const result = run(dir, '--check');
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /gone: .*not found/);
  });
}));

record(test('--check fails until apply runs, then passes', () => {
  withRepo({ skills: ['demo'], commands: [] }, { 'skills/demo/SKILL.md': SKILL }, dir => {
    const before = run(dir, '--check');
    assert.strictEqual(before.status, 1);
    assert.match(before.stderr, /missing disable-model-invocation: true/);
    run(dir);
    assert.strictEqual(run(dir, '--check').status, 0);
  });
}));

record(test('--restore removes the flag from one skill', () => {
  withRepo({ skills: ['demo'], commands: [] }, { 'skills/demo/SKILL.md': SKILL }, dir => {
    run(dir);
    const result = run(dir, '--restore', 'demo');
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(read(dir, 'skills/demo/SKILL.md'), SKILL);
  });
}));

record(test('--restore errors on an unknown name', () => {
  withRepo({ skills: [], commands: [] }, {}, dir => {
    const result = run(dir, '--restore', 'nope');
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /No skill or command named nope/);
  });
}));

console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
