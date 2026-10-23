---
name: systems-project-ops
description: Run IT systems projects end to end - migrations, tenant builds, Intune/Autopilot rollouts, MFA and Conditional Access rollouts, app deployments - using a project folder on disk as the source of truth for charter, roadmap, phases, tasks, risks, decisions, and a work log. Use when starting, resuming, reviewing, or closing out any multi-day systems project, or when the user asks "where are we on <project>".
metadata:
  origin: community
---

# Systems Project Ops

A systems project lasts weeks and spans many Claude sessions. Claude remembers
nothing between sessions, so **the project folder is the memory**. Every session
starts by reading it and ends by updating it. If it is not in the folder, it did
not happen.

## When to Activate

- Starting a new project ("we're moving <client>'s file server to SharePoint")
- Resuming one ("let's keep going on the Intune rollout")
- Status questions ("where are we", "what's blocking", "what's left")
- Phase gates ("are we ready to start the pilot?")
- Closeout (as-built docs, KBs, handoff to support)

## Project Folder

Projects live under a projects root the user chooses on first use (recommend a
folder backed up by the employer's OneDrive or SharePoint, never a personal one,
because these files describe client systems).

```text
<projects-root>/<client>-<project-slug>/
  STATUS.md        # READ FIRST. One screen: phase, next actions, blockers, waiting-on
  PROJECT.md       # Charter: goal, scope, stakeholders, success criteria, constraints
  ROADMAP.md       # Phases, gates, milestones, target dates, wave plan
  phases/          # One file per phase: tasks, entry/exit criteria, notes
  RAID.md          # Risks, Assumptions, Issues, Dependencies
  DECISIONS.md     # Decision log: what was decided, why, by whom, alternatives
  LOG.md           # Append-only dated work log
  evidence/        # Exports, reports, command output that prove a task is done
  runbooks/        # Cutover runbook, rollback plan, go/no-go checklist
  comms/           # Drafts of client and end-user communications
  deliverables/    # As-built doc, KB articles, final report
```

Templates for every file are in `templates/` next to this skill. Playbooks for
common project types are in `playbooks/`.

## Phase Model

Every project uses the same seven phases. Small projects move through some in
an hour; the gates still apply.

| # | Phase | Purpose | Exit gate (all must be true) |
|---|---|---|---|
| 0 | **Intake** | Understand the ask | Goal, scope, sponsor, and deadline written in PROJECT.md; user approved the charter |
| 1 | **Discovery** | Measure the current state | Inventory exported to `evidence/`; risks logged; no unanswered question that changes the design |
| 2 | **Design** | Decide the target state and the plan | Design decisions in DECISIONS.md; roadmap with waves and dates; rollback approach for every risky change; client sign-off recorded |
| 3 | **Build & Pilot** | Build it and prove it on a small group | Pilot users working; pilot issues fixed or accepted; cutover runbook written and rehearsed where possible |
| 4 | **Rollout** | Deploy in waves or cut over | Every wave complete and verified; go/no-go recorded for each |
| 5 | **Hypercare** | Catch what broke | Agreed hypercare window passed; open issues triaged; ticket volume back to normal |
| 6 | **Closeout** | Hand off cleanly | As-built doc, KBs, and admin notes delivered; old systems decommission plan approved; lessons learned written |

Never skip a gate silently. If the user wants to move on with a gate item
unmet, record it in DECISIONS.md as an accepted risk, with who accepted it.

## Task Format

Tasks live in the phase files as checklist lines:

```text
- [ ] 3.04 Create pilot group SG-Intune-Pilot · owner: jdoe · approval: B · evidence:
```

| Marker | Meaning |
|---|---|
| `[ ]` | To do |
| `[~]` | In progress |
| `[!]` | Blocked (say on what, in RAID.md as an issue or dependency) |
| `[x]` | Done, and `evidence:` points to proof |
| `[-]` | Skipped, with the reason |

**A task is not done without evidence.** Evidence is a file in `evidence/`, a
command and its output summarized in LOG.md, a client confirmation (who, when),
or a screenshot reference. "I ran it" is not evidence.

## Autonomy Levels

The goal is to finish projects end to end, so do as much as possible without
waiting, but never cross these lines. Every task carries an approval level.

| Level | What | Examples |
|---|---|---|
| **A - Just do it** | Read-only work and documentation | Discovery exports, reading configs, drafting docs, writing scripts (not running write scripts), updating project files, research on Microsoft Learn |
| **B - Batch approval** | Reversible changes in a pilot or test scope | Create groups, create policies in report-only mode, configure pilot users, stage migration jobs in a test library |
| **C - Approve each one** | Production changes, user-visible changes, anything touching many users | Enforce a policy, run a migration wave, change DNS/MX, assign licenses tenant-wide, send comms |
| **D - Destructive, explicit approval** | Irreversible or control-weakening actions. Done only after the user approves that specific request by its ID | Delete the old server after migration, remove migrated source data, wipe devices, purge mailboxes or recycle bins, decommission systems, security-control exceptions |

Level D tasks follow the `destructive-change-approval` skill: stage them
(isolate, wait, final backup, then destroy), prepare a `DEL-<nnn>` request with
safety checks and a preview, and act only on `approve DEL-<nnn>` from the user.
Approving the plan or runbook that contains a D task does not approve the task.
When unsure of the level, go one level stricter.

## Session Loop

### Start of every session (resume protocol)

1. Read `STATUS.md`, then `ROADMAP.md`, then the current phase file, then the last ~20 entries of `LOG.md`.
2. Tell the user in 3-5 lines: current phase, what was last done, what is next, what is blocked or waiting on someone.
3. Check for staleness: any `[~]` task older than a week, any `[!]` blocker without an owner, any target date already passed. Mention them.
4. Propose the next 3-5 tasks with their approval levels, then start on the level A ones immediately.

### During the session

- Work tasks in order unless a dependency says otherwise.
- After each completed task: tick it, add evidence, append one line to LOG.md.
- New risk or surprise -> RAID.md right away, not at the end.
- A choice was made -> DECISIONS.md with the reason.
- Repeatable fix discovered -> note it as a KB candidate in the phase file.
- For a single technical task, follow the matching skill (`m365-user-lifecycle`, `m365-license-ops`, `m365-security-triage`, `saas-app-admin`) or hand it to the `m365-admin` agent.

### End of every session

1. Rewrite `STATUS.md` (it is a snapshot, not a log): phase, % of phase tasks done, next actions, blockers, waiting-on (who and since when), next client touchpoint.
2. Append a LOG.md entry summarizing the session.
3. Tell the user what changed and what they need to do or chase before next time.

## Planning Rules

- **Discovery before design.** Do not pick tools, waves, or dates until the inventory exists. Estimates without data are guesses; label them as such.
- **Pilot before rollout.** Every project that touches users has a pilot group, ideally including at least one person who will complain loudly.
- **Waves, not big bangs.** Split rollout into waves by department, site, or data set. The first wave is the smallest.
- **Rollback for every risky change.** If a change has no rollback, it is level D: it gets a `DEL-<nnn>` approval request and, in rollout, a go/no-go.
- **Dates come from dependencies.** Client approvals, vendor lead times, hardware shipping, licensing purchases, and change freeze windows go in RAID.md as dependencies with dates.
- **Verify on Microsoft Learn.** Limits, licensing requirements, and admin center paths change. Check current docs when they affect the design, and cite the page in DECISIONS.md.
- **No secrets in the folder.** Never write passwords, keys, recovery codes, or tokens into project files. Reference the password manager entry instead.
- **Client data is sensitive.** Evidence exports may contain user names and file paths. Keep them in `evidence/` and out of client-facing deliverables unless needed.

## Output Format

For status questions, answer from the files in this shape:

```text
<CLIENT> - <PROJECT> - Phase <n>: <name> (<x>/<y> tasks done)

Last done:  <most recent completed tasks>
Next:       <next 3 tasks, with approval level>
Blocked:    <task - on what - owner>
Waiting on: <who - what - since when>
Risks:      <top 1-3 open risks>
Dates:      <next milestone and whether it is on track>
```

## Good Use Cases

- "New project: migrate <client>'s NAS shares to SharePoint, target end of next month"
- "Resume the Intune project" / "where are we on <client> MFA?"
- "Are we ready to move from pilot to wave 1?"
- "Write the weekly status for <client>"
- "Close out the tenant build and give me the as-built doc"

## Anti-Patterns

- Keeping project state in chat instead of the project folder
- Marking tasks done without evidence
- Choosing tools, waves, or dates before discovery data exists
- Skipping the pilot, or making the first wave the biggest
- Passing a gate silently with unmet criteria instead of recording an accepted risk
- Deleting source systems as part of cutover instead of after the waiting period

## Related Skills

- `destructive-change-approval` - every level D task
- `kb-article-writing` - closeout documentation
- `m365-user-lifecycle`, `m365-license-ops`, `m365-security-triage`, `saas-app-admin` - technical tasks inside a project
