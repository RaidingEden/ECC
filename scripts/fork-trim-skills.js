#!/usr/bin/env node
/**
 * Hide unused skills and commands from Claude's skill listing (fork only).
 *
 * Reads config/fork-skill-trim.json and sets `disable-model-invocation: true`
 * in the frontmatter of every listed skills/<name>/SKILL.md and
 * commands/<name>.md. Hidden entries stay installed and can still be run by
 * name; they just stop taking up the listing's description budget. It also
 * refreshes the registry digest pinned in the skill-triggers manifest. Running
 * it again is a no-op, so rerun it after every upstream merge.
 *
 * Usage:
 *   node scripts/fork-trim-skills.js                  apply the list
 *   node scripts/fork-trim-skills.js --check          fail if any entry is missing or not flagged
 *   node scripts/fork-trim-skills.js --restore <name> remove the flag from one skill or command
 *   [--root <dir>]                                    repository root (default: this repo)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LIST_FILE = path.join('config', 'fork-skill-trim.json');
const FLAG_KEY = 'disable-model-invocation';
const FLAG_LINE_RE = /^disable-model-invocation:.*$/m;
const FLAG_TRUE_RE = /^disable-model-invocation:\s*true\s*$/m;
const FRONTMATTER_RE = /^---(\r?\n)([\s\S]*?)\r?\n---(\r?\n|$)/;
const TRIGGERS_MANIFEST = path.join('manifests', 'context-packs', 'skill-triggers@1.json');

function parseArgs(argv) {
  const options = { mode: 'apply', root: path.join(__dirname, '..'), restore: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') options.mode = 'check';
    else if (arg === '--restore') {
      options.mode = 'restore';
      options.restore = argv[++index];
      if (!options.restore) throw new Error('--restore needs a skill or command name');
    } else if (arg === '--root') options.root = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function loadList(root) {
  const list = JSON.parse(fs.readFileSync(path.join(root, LIST_FILE), 'utf8'));
  if (!Array.isArray(list.skills) || !Array.isArray(list.commands)) {
    throw new Error(`${LIST_FILE} must have "skills" and "commands" arrays`);
  }
  return list;
}

function targetsFor(list) {
  return [
    ...list.skills.map(name => ({ name, file: path.join('skills', name, 'SKILL.md') })),
    ...list.commands.map(name => ({ name, file: path.join('commands', `${name}.md`) })),
  ];
}

/** Rebuild the text with a new frontmatter body, or return null when there is no frontmatter. */
function replaceFrontmatter(text, transform) {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) return null;
  const [block, eol, body, closingEol] = match;
  return `---${eol}${transform(body, eol)}${eol}---${closingEol}${text.slice(block.length)}`;
}

function withFlag(text) {
  return replaceFrontmatter(text, (body, eol) => (FLAG_LINE_RE.test(body)
    ? body.replace(FLAG_LINE_RE, `${FLAG_KEY}: true`)
    : `${body}${eol}${FLAG_KEY}: true`));
}

function withoutFlag(text) {
  return replaceFrontmatter(text, (body, eol) => body
    .split(/\r?\n/)
    .filter(line => !line.startsWith(`${FLAG_KEY}:`))
    .join(eol));
}

function isFlagged(text) {
  const match = FRONTMATTER_RE.exec(text);
  return Boolean(match) && FLAG_TRUE_RE.test(match[2]);
}

function missingProblem({ name, file }) {
  return `${name}: ${file} not found (renamed or removed upstream?)`;
}

function apply(root, targets) {
  const problems = [];
  let changed = 0;
  for (const target of targets) {
    const fullPath = path.join(root, target.file);
    if (!fs.existsSync(fullPath)) {
      problems.push(missingProblem(target));
      continue;
    }
    const text = fs.readFileSync(fullPath, 'utf8');
    if (isFlagged(text)) continue;
    const updated = withFlag(text);
    if (updated === null) {
      problems.push(`${target.name}: ${target.file} has no frontmatter`);
      continue;
    }
    fs.writeFileSync(fullPath, updated);
    changed += 1;
  }
  return { changed, problems };
}

/**
 * The skill-triggers manifest pins a digest of the skill registry, which
 * includes disable-model-invocation, so flagging skills makes it stale. The
 * trigger phrases themselves don't change; only the pinned digest is refreshed.
 */
function refreshTriggerDigest(root) {
  const manifestPath = path.join(root, TRIGGERS_MANIFEST);
  if (!fs.existsSync(manifestPath)) return false;
  const { loadContextRegistry } = require('./lib/context-pack-registry');
  const { registryDigest } = loadContextRegistry({ repoRoot: root });
  const text = fs.readFileSync(manifestPath, 'utf8');
  const updated = text.replace(/("registryDigest":\s*")[0-9a-f]+(")/, `$1${registryDigest}$2`);
  if (updated === text) return false;
  fs.writeFileSync(manifestPath, updated);
  return true;
}

function check(root, targets) {
  return targets.flatMap(target => {
    const fullPath = path.join(root, target.file);
    if (!fs.existsSync(fullPath)) return [missingProblem(target)];
    if (!isFlagged(fs.readFileSync(fullPath, 'utf8'))) return [`${target.name}: ${target.file} is missing ${FLAG_KEY}: true`];
    return [];
  });
}

function restore(root, name) {
  const file = [path.join('skills', name, 'SKILL.md'), path.join('commands', `${name}.md`)]
    .find(candidate => fs.existsSync(path.join(root, candidate)));
  if (!file) throw new Error(`No skill or command named ${name}`);
  const fullPath = path.join(root, file);
  const updated = withoutFlag(fs.readFileSync(fullPath, 'utf8'));
  if (updated === null) throw new Error(`${file} has no frontmatter`);
  fs.writeFileSync(fullPath, updated);
  return file;
}

function main() {
  const options = parseArgs(process.argv);

  if (options.mode === 'restore') {
    const file = restore(options.root, options.restore);
    refreshTriggerDigest(options.root);
    console.log(`Removed ${FLAG_KEY} from ${file}. Also remove "${options.restore}" from ${LIST_FILE}.`);
    return 0;
  }

  const targets = targetsFor(loadList(options.root));

  if (options.mode === 'check') {
    const problems = check(options.root, targets);
    problems.forEach(problem => console.error(`  ✗ ${problem}`));
    if (problems.length) {
      console.error(`\n${problems.length} trimmed entries out of sync; run npm run fork:trim.`);
      return 1;
    }
    console.log(`All ${targets.length} trimmed skills and commands are hidden from the listing.`);
    return 0;
  }

  const { changed, problems } = apply(options.root, targets);
  problems.forEach(problem => console.error(`  ✗ ${problem}`));
  console.log(`Flagged ${changed} file(s); ${targets.length - changed - problems.length} already flagged.`);
  if (refreshTriggerDigest(options.root)) console.log(`Refreshed registryDigest in ${TRIGGERS_MANIFEST}.`);
  return problems.length ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`fork-trim-skills: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { withFlag, withoutFlag, isFlagged, apply, check, restore };
