# Cutover Runbook - <Project> - <Wave / event>

**Window:** <date, start-end time, time zone> · **Change ticket:** <id>
**Executor:** <name> · **Approver (go/no-go):** <name> · **Comms owner:** <name>

## Go / no-go checklist (T-24h)
- [ ] Pilot or previous wave verified and signed off
- [ ] Rehearsal done or skipped with accepted risk (DECISIONS.md D-xxx)
- [ ] Backups / source snapshot confirmed: <how, where>
- [ ] Users notified (comms/<file>) on <date>
- [ ] Support briefed; KB drafts ready
- [ ] Rollback steps below reviewed by executor
- **Decision:** <GO / NO-GO> - by <name> at <time>

## Steps

| # | Time | Step | Approval | Verify | Done |
|---|---|---|---|---|---|
| 1 | T-0:00 | <e.g. set source share read-only> | C | <test write fails> | [ ] |
| 2 | | <run final incremental migration> | C | <task report: 0 failures> | [ ] |
| 3 | | <update drive mappings / shortcuts> | C | <pilot user opens file> | [ ] |

## Verification (end of window)
- [ ] <test as a real user from each affected group>
- [ ] <reports / counts match expected>

## Rollback
**Trigger:** <what failure means we roll back, and the latest time a rollback is still clean>

| # | Step | Owner |
|---|---|---|
| 1 | <e.g. set source share back to read-write> | |
| 2 | <restore drive mappings> | |
| 3 | <notify users> | |

**Point of no return:** <the step after which rollback is no longer simple, if any>

## After the window
- [ ] LOG.md updated with outcome and timings
- [ ] Issues from the window logged in RAID.md
- [ ] Hypercare contacts sent to users
