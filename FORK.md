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
| Fork maintenance | This page, the README banner, `scripts/ci/check-fork-changes.js` (`npm run fork:check`), `.claude/rules/fork-changes.md` | This page |

## Change Log

Newest first. Every commit that exists on this fork but not on upstream must
appear here, by PR number or by its commit subject. `npm run fork:check`
enforces that.

| Date | Change | PR / Commit | Why |
|------|--------|-------------|-----|
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
is here. Merge commits are not logged; only fork-authored commits are.

## Keeping This Page Current

For every change to this fork:

1. Add a Change Log row in the same PR: date, the commit subject (or PR title), the PR link, and why.
2. If the change adds or removes a surface, update **What This Fork Adds**.
3. Run `npm run fork:check` before merging. It lists any fork-only commit missing from this page.
