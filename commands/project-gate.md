---
description: Run a phase gate review on an IT systems project - audit the folder, check every exit criterion against evidence, and ask for approval to move to the next phase.
argument-hint: "[client or project name | path] [phase number, defaults to current]"
---

# Project Gate

Follow the `systems-project-ops` skill's phase model.

## Steps

1. **Locate the project** as in `/project-resume`.
2. **Audit.** Hand the folder path to the `project-auditor` agent. If agents are unavailable, run its checks inline, read-only.
3. **Check each exit criterion** of the phase in `phases/<n>-*.md` against evidence. A criterion is met only if evidence exists; "probably fine" is unmet.
4. **Present the gate review:**

   ```text
   GATE REVIEW - <project> - Phase <n> (<name>) -> Phase <n+1> (<name>)

   Exit criteria
   - [x] <criterion> - evidence: <where>
   - [ ] <criterion> - missing: <what>

   Audit findings that block the gate
   - <finding>

   Recommendation: <PASS | PASS WITH ACCEPTED RISKS | NOT READY>
   ```

5. **Ask for the decision.** If the user passes the gate with unmet criteria, write a DECISIONS.md entry naming each accepted gap and who accepted it.
6. **On pass:** mark the gate approved in the phase file and ROADMAP.md (date, approver), set the next phase In progress, add its entry criteria check, update STATUS.md, and append LOG.md.
7. **On not ready:** turn each gap into a task in the current phase file and update STATUS.md.

For gates into Rollout (phase 4), also confirm a cutover runbook exists in `runbooks/` with a rollback section and a go/no-go owner.
