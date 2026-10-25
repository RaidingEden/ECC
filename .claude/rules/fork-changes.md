# Fork Change Log

This checkout is the RaidingEden/ECC fork of affaan-m/ECC. Fork-only changes
are documented in [FORK.md](../../FORK.md).

## Every Change to This Fork

- Add a row to the FORK.md **Change Log** in the same PR: date, the commit subject or PR title, the PR link (or short SHA for a direct commit), and why the change was made.
- When the change adds, removes, or renames an agent, skill, command, hook, rule, or install module, update **What This Fork Adds** too.
- Run `npm run fork:check` before merging; it fails on any commit not on `upstream/main` that FORK.md does not mention.
- After the merge, reinstall the plugin as described in FORK.md **Installing and Updating**.

## Upstream Merges

Merge commits from `upstream/main` are not logged. After a sync, rerun
`npm run catalog:sync` and confirm the fork-only entries in FORK.md still
match what is in the tree.
