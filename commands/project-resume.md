---
description: Resume an IT systems project from its folder - read status, summarize where things stand, flag stale items, propose next tasks, and start working on the safe ones.
argument-hint: "[client or project name | path to project folder]"
---

# Project Resume

Follow the `systems-project-ops` skill's session loop.

## Steps

1. **Locate the project.** Use `$ARGUMENTS` as a path or a name to match under the projects root (`~/.claude/it-projects-root.txt`). If several match, list them with their STATUS.md phase and last-updated date and ask which. If none is given, list active projects (phase 6 not done) and ask.
2. **Read**, in order: STATUS.md, ROADMAP.md, the current phase file, the last ~20 LOG.md entries, open items in RAID.md.
3. **Brief the user** in this shape:

   ```text
   <CLIENT> - <PROJECT> - Phase <n>: <name> (<x>/<y> done)
   Last session: <date> - <what was done>
   Next:       <next 3-5 tasks with approval level>
   Blocked:    <task - on what - owner>
   Waiting on: <who - what - since when>
   Stale:      <in-progress 7+ days, past-due dates, ownerless blockers>
   ```

4. **Start work.** Begin level A tasks right away. Group level B tasks into one approval request. Ask for level C tasks one at a time. For level D tasks, follow the `destructive-change-approval` skill: prepare the `DEL-<nnn>` request with safety checks and a fresh preview, and carry it out only after the user replies `approve DEL-<nnn>`.
5. **Keep the files current** as you go: tick tasks with evidence, append LOG.md, add new risks and decisions immediately.
6. **End of session:** rewrite STATUS.md, add a LOG.md session summary, and tell the user what they need to chase or approve before next time.
