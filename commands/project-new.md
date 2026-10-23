---
description: Start a new IT systems project - run a short intake, create the project folder from templates, draft charter, roadmap, phases, and risks, then stop for approval of the charter.
argument-hint: "<client> <short description of the project>"
---

# Project New

Follow the `systems-project-ops` skill.

## Steps

1. **Find the projects root.** Read `~/.claude/it-projects-root.txt`. If it does not exist, ask the user where projects should live (recommend a folder backed up by their employer's OneDrive or SharePoint), then write the path to that file.
2. **Intake.** From `$ARGUMENTS` and the conversation, collect the items below. Ask only for what is missing, in one message, not one question at a time:
   - Client and tenant domain
   - Goal in one sentence, and why now
   - What is in scope and what is explicitly out
   - Sponsor at the client, and who approves go/no-go
   - Deadline (hard or soft) and any blackout windows
   - Known constraints: licenses on hand, budget, hardware, compliance
3. **Create the folder** `<root>/<client>-<project-slug>/`. If it already exists, stop and offer `/project-resume` instead.
4. **Draft the plan.** Hand the folder path and the intake brief to the `project-planner` agent. If agents are unavailable, do the planner's workflow inline.
5. **Review the result** yourself: open PROJECT.md and ROADMAP.md, and fix anything that contradicts what the user said.
6. **Present** to the user:
   - Charter summary (goal, scope in/out, success criteria)
   - Phase timeline and the critical path
   - Assumptions and open questions that need answers
   - Top 3 risks
7. **Stop.** Do not start phase 1 until the user approves the charter. Record the approval in `phases/0-intake.md` and LOG.md when it comes.

Do not run any command against a client tenant during this command.
