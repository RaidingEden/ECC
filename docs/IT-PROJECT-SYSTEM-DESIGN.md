# Project System Design

Why the systems project tooling in the [IT Admin Kit](IT-ADMIN-KIT.md) is built the way it is.

## The problem

Systems projects run for weeks, across dozens of sessions, with long waits on
clients, vendors, and change windows. Three things break a naive "project agent":

1. **Claude forgets between sessions.** A new session knows nothing about last week.
2. **Subagents can't stop and ask you anything.** An agent runs its task and reports
   back; it can't pause for "approve this change?" partway through.
3. **"Finish it end to end" collides with "don't break production."** Autonomy has
   to be real for safe work and impossible for dangerous work.

## The design in five decisions

### 1. The project folder is the memory
Every project is a folder of plain markdown files: STATUS, PROJECT (charter),
ROADMAP, one file per phase, RAID, DECISIONS, LOG, plus evidence, runbooks,
comms, and deliverables. Every session reads it first and updates it last. This
makes any session (or any technician) able to pick up the project cold, and it
doubles as the client documentation, so writing it costs no extra time.

STATUS.md is deliberately tiny: the one file to read to know where things stand.

### 2. The main conversation is the project lead, not a subagent
The lead has to ask for approvals and answer questions, so it runs in your main
Claude session, guided by the `systems-project-ops` skill and the `/project-*`
commands. Two subagents do bounded jobs that don't need you mid-run:

| Agent | Job | Why separate |
|---|---|---|
| `project-planner` | Turn an intake brief into a full plan on disk | Big, self-contained writing job; records open questions instead of asking them |
| `project-auditor` | Read-only health check before gates and status meetings | Fresh eyes; can't modify anything, so it can't "fix" problems by hiding them |

Technical tasks inside a project use the existing skills (`m365-user-lifecycle`,
`saas-app-admin`, ...) and the `m365-admin` agent.

### 3. Same seven phases for every project, with hard gates
Intake -> Discovery -> Design -> Build & Pilot -> Rollout -> Hypercare -> Closeout.
A gate is a checklist of true/false criteria backed by evidence. Skipping a gate
is allowed but never silent: it becomes a DECISIONS.md entry with a name on it.
This is what makes the system something you can rely on: progress can't be
claimed, only shown.

### 4. Four autonomy levels on every task

| Level | Rule | Examples |
|---|---|---|
| A | Do it now | Discovery, reading config, drafting docs and scripts |
| B | One approval per batch | Reversible pilot-scope changes, report-only policies |
| C | Approve each | Production, user-visible, tenant-wide changes, sending comms |
| D | Explicit approval of that exact request (`approve DEL-<nnn>`) | Delete the old server after migration, wipes, purges, decommissions, security-control exceptions |

This is how "finish it end to end" works: Claude does all the A work without
waiting, bundles B work into few approvals, walks you through C, and for D
prepares a request showing exactly what will be destroyed, the evidence it is
safe, and a fresh preview, then acts only on your explicit approval of that ID.
D work is staged by default (isolate, wait, final backup, then destroy), and the
rules live in one shared skill, `destructive-change-approval`, so day-to-day
tickets and projects follow the same process.

### 5. Playbooks hold the domain knowledge
The phase model is generic; playbooks make it specific. Each playbook gives the
discovery checklist (with read-only commands), the design decisions to record,
pilot and rollout steps, validation, and the gotchas that bite in real projects.
Closeout asks "what should we add to the playbook?" so they improve with each
project.

## A project's life

```text
/project-new contoso "move NAS shares to SharePoint by Dec 15"
  -> intake questions -> project-planner writes the folder -> you approve the charter
/project-resume contoso
  -> brief: phase, next, blocked -> discovery exports (level A) run immediately
  -> ... many sessions, each ending with STATUS.md rewritten ...
/project-gate contoso
  -> project-auditor checks evidence -> PASS / NOT READY -> next phase
/project-report contoso client
  -> client status draft in comms/ for you to review and send
/project-report contoso closeout
  -> as-built, KB drafts, decommission plan, lessons learned
```

## Known limits

- Playbook facts were checked on Microsoft Learn on 2026-10-23; Microsoft changes
  limits and admin center paths, so the skill tells Claude to re-verify at design time.
- Nothing here talks to your PSA/ITSM. Status lives in the
  folder; tickets are referenced by number. An MCP connection could sync them later.
- Dates are only as good as the dependencies recorded. The system flags slipping
  dates; it can't make clients approve faster.
- Evidence exports can contain user names and paths. Keep project folders on
  employer-controlled storage.
