# RaidingEden/ECC Fork

This repository is a personal fork of [affaan-m/ECC](https://github.com/affaan-m/ECC).
It tracks upstream and adds a small set of surfaces of its own. Everything
upstream documents in [README.md](README.md) still applies; this page lists
only what is different here.

## What This Fork Adds

| Area | Surfaces | Docs |
|------|----------|------|
| IT admin kit | `m365-admin`, `project-planner`, `project-auditor` agents; `kb-article-writing`, `m365-user-lifecycle`, `m365-license-ops`, `m365-security-triage`, `saas-app-admin`, `systems-project-ops`, `destructive-change-approval` skills; `/project-new`, `/project-resume`, `/project-gate`, `/project-report` commands; install module `it-admin-ops` | [docs/IT-ADMIN-KIT.md](docs/IT-ADMIN-KIT.md), [docs/IT-PROJECT-SYSTEM-DESIGN.md](docs/IT-PROJECT-SYSTEM-DESIGN.md) |
| Workflow skills ported from [obra/superpowers](https://github.com/obra/superpowers) (MIT) | `brainstorming`, `systematic-debugging`, `receiving-code-review`, `verification-before-completion`, in the `workflow-quality` install module | Each skill's `SKILL.md` |
| Trimmed skill listing | 144 skills and 23 commands outside this fork's work (other languages and frameworks, unrelated industries, crypto, marketing, video, other agent platforms, deprecated skills) carry `disable-model-invocation: true`, so they drop out of Claude's skill listing and the skills that matter keep their descriptions within the listing budget. They stay installed and run by name (`/ecc:<name>`). The list is `config/fork-skill-trim.json`; `scripts/fork-trim-skills.js` applies it (`npm run fork:trim`), checks it (`npm run fork:trim:check`), and restores one entry (`--restore <name>`). Six unused skills stay visible because upstream tests depend on their frontmatter or on routing through them; the list file names them | This page, `config/fork-skill-trim.json` |
| Fork maintenance | This page, the README banner, `scripts/ci/check-fork-changes.js` (`npm run fork:check`), `.claude/rules/fork-changes.md`, GitHub workflows `fork-change-log.yml` (PR check) and `upstream-drift.yml` (weekly sync reminder) | This page |

## Change Log

Newest first. Every commit that exists on this fork but not on upstream must
appear here, by PR number or by its commit subject. `npm run fork:check`
enforces that.

| Date | Change | PR / Commit | Why |
|------|--------|-------------|-----|
| 2026-10-25 | feat: hide unused skills and commands from the skill listing | [#4](https://github.com/RaidingEden/ECC/pull/4) | With 322 skills and 101 commands, the listing overflowed its budget and most skills, including the IT admin kit, reached Claude as bare names, so natural-language requests could miss them. `skillOverrides` doesn't apply to plugin skills and the manifest `skills` key can't exclude, so the flag goes in each skill's frontmatter from a re-runnable list. |
| 2026-10-24 | ci: run the fork change log check on GitHub and add a weekly upstream drift reminder | [#3](https://github.com/RaidingEden/ECC/pull/3) | `fork:check` only ran locally, and nothing flagged when upstream moved ahead. |
| 2026-10-24 | docs: document fork changes and enforce a fork change log | [#2](https://github.com/RaidingEden/ECC/pull/2) | The README and GitHub page showed only upstream's description, so nothing said what this fork changes. |
| 2026-10-24 | feat: port four superpowers workflow skills as ECC-native skills | [#1](https://github.com/RaidingEden/ECC/pull/1) | Adds the brainstorming, root-cause debugging, review-reception, and evidence-before-claims workflows ECC lacked, without installing superpowers alongside ECC. |
| 2026-10-23 | feat: add IT admin kit for Microsoft 365 / MSP administration and systems projects | `14b4232b` | M365/MSP administration and end-to-end systems project work, with explicit approval for destructive changes. |

## Installing and Updating

The installed plugin comes from this fork's `main` (marketplace `ecc`, plugin
`ecc@ecc`). `claude plugin update ecc@ecc` only moves when the version number
changes, and fork changes keep upstream's version, so refresh with a reinstall
after merging:

```bash
claude plugin marketplace update ecc
```

```bash
claude plugin uninstall ecc@ecc --keep-data
```

```bash
claude plugin install ecc@ecc
```

Start a new session afterwards so the new skills and agents load.

## Syncing With Upstream

```bash
git fetch upstream
```

```bash
git merge upstream/main
```

After a merge, rerun `npm run catalog:sync` (counts change when either side
adds skills) and check that the fork-only entries above still describe what
is here. Then run `npm run fork:trim` so the trimmed skills keep their flag
(an upstream edit to one of those files can drop it) and the skill-triggers
manifest's pinned registry digest is refreshed. A conflict on that digest line
is resolved the same way: take either side, then rerun `npm run fork:trim`.
`npm run fork:trim:check` also fails when a listed skill was renamed or
removed upstream; update `config/fork-skill-trim.json` to match. Merge commits are not logged; only fork-authored commits are.

The **Upstream Drift** workflow runs every Monday (13:00 UTC, or on demand
from the Actions tab). It fails when upstream `main` has commits this fork
lacks, so GitHub's failed-run email is the reminder, and its run summary lists
the waiting commits.

Upstream's own workflows (CI, release, maintenance, metrics, and so on) are
disabled on this fork so they don't run against it; only the two fork
workflows are active. Re-enable one with `gh workflow enable <file>`.

## Keeping This Page Current

For every change to this fork:

1. Add a Change Log row in the same PR: date, the commit subject (or PR title), the PR link, and why.
2. If the change adds or removes a surface, update **What This Fork Adds**.
3. Run `npm run fork:check` before merging. It lists any fork-only commit missing from this page. The **Fork Change Log** workflow runs the same check on every PR and push to `main`.
