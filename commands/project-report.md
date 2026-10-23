---
description: Generate a report from an IT systems project folder - weekly internal status, client-facing status update, or the closeout package (as-built, KB list, lessons learned).
argument-hint: "[client or project name | path] [weekly | client | closeout]"
---

# Project Report

Build every report only from what is in the project folder. If something is not
recorded there, it does not go in the report; list it as a gap instead.

## Report types

### weekly (default) - internal
- Phase and progress, health (on track / at risk / off track) with the reason
- Done this week (from LOG.md), with evidence links
- Next week's plan
- Blockers, dependencies, and who needs to be chased
- Risk changes (new, escalated, closed)
- Hours or effort, if LOG.md records them

### client - goes to the client sponsor
- Plain language, no PowerShell, no internal notes, no user names from evidence exports
- What was accomplished, what is next, what we need from them (approvals, dates, people), any decisions for them to make
- Upcoming user-visible events (pilot, waves, cutover windows) with dates
- Save the draft to `comms/status-<YYYY-MM-DD>.md`. Do not send it; the user reviews and sends.

### closeout
- Fill `deliverables/as-built.md` from `templates/as-built.md` using the phase files, DECISIONS.md, and evidence
- List every KB candidate from the phase files; draft each one with the `kb-article-writing` skill into `deliverables/kb/`
- Decommission plan for old systems: isolate date, waiting period, final backup, and a planned `DEL-<nnn>` request for each deletion (level D, approved one at a time)
- Lessons learned, plus suggested additions to the playbook used
- Run the `project-auditor` agent on the folder and fix any closeout gaps before presenting

## Steps
1. Locate the project as in `/project-resume`.
2. Read STATUS.md, ROADMAP.md, all phase files, RAID.md, DECISIONS.md, LOG.md.
3. Produce the requested report and save it in the project folder (`comms/` for client, `deliverables/` for closeout, `comms/internal-<date>.md` for weekly).
4. Append a LOG.md line noting the report was generated.
