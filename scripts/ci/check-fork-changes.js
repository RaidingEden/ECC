#!/usr/bin/env node
/**
 * Require every fork-only commit to appear in FORK.md's change log.
 *
 * A fork-only commit is one reachable from HEAD but not from the upstream
 * base ref (default `upstream/main`), merge commits excluded. A commit is
 * logged when FORK.md mentions its PR number (`#N`, taken from a trailing
 * "(#N)" in the subject) or contains its subject with that suffix removed.
 * When the base ref is not available (no upstream remote, shallow CI clone),
 * the check is skipped with a note instead of failing.
 *
 * Usage: node scripts/ci/check-fork-changes.js [--base <ref>] [--root <dir>]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_BASE = 'upstream/main';
const FORK_DOC = 'FORK.md';
const PR_SUFFIX_RE = /\s*\(#(\d+)\)\s*$/;

function parseArgs(argv) {
  const options = { base: DEFAULT_BASE, root: path.join(__dirname, '../..') };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === '--base') options.base = argv[++index];
    else if (argv[index] === '--root') options.root = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function hasRef(root, ref) {
  try {
    git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function forkOnlyCommits(root, base) {
  const output = git(root, ['log', '--no-merges', '--format=%h%x09%s', `${base}..HEAD`]);
  return output.split('\n').filter(Boolean).map(line => {
    const tab = line.indexOf('\t');
    return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
  });
}

function isLogged(commit, doc) {
  const pr = PR_SUFFIX_RE.exec(commit.subject);
  if (pr && new RegExp(`#${pr[1]}(?!\\d)`).test(doc)) return true;
  const subject = commit.subject.replace(PR_SUFFIX_RE, '').trim();
  return subject.length > 0 && doc.includes(subject);
}

function findUnlogged(commits, doc) {
  return commits.filter(commit => !isLogged(commit, doc));
}

function main() {
  const { base, root } = parseArgs(process.argv);
  if (!hasRef(root, base)) {
    console.log(`Fork change log check skipped: ${base} is not available (run git fetch upstream).`);
    return;
  }
  const docPath = path.join(root, FORK_DOC);
  if (!fs.existsSync(docPath)) {
    console.error(`${FORK_DOC} is missing; it must log every commit not on ${base}.`);
    process.exit(1);
  }
  const commits = forkOnlyCommits(root, base);
  const unlogged = findUnlogged(commits, fs.readFileSync(docPath, 'utf8'));
  if (unlogged.length) {
    console.error(`${FORK_DOC} change log is missing ${unlogged.length} fork-only commit(s):`);
    for (const commit of unlogged) console.error(`  ${commit.sha} ${commit.subject}`);
    console.error('Add a Change Log row with the PR number or the commit subject.');
    process.exit(1);
  }
  console.log(`${FORK_DOC} logs all ${commits.length} fork-only commit(s) since ${base}.`);
}

if (require.main === module) main();

module.exports = { findUnlogged, isLogged };
