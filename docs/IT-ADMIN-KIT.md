# IT Admin Kit

Agents, skills, and commands for Microsoft 365 / MSP system administration and
for running systems projects end to end. Install module: `it-admin-ops`
(component `capability:it-admin`).

## Day-to-day admin

| Surface | What it is | Triggers on |
|---|---|---|
| `agents/m365-admin.md` | Tenant admin agent: read-first diagnosis, change plans with rollback, ticket notes | M365 tickets, tenant reviews |
| `skills/kb-article-writing` | KB articles for end users and technicians | "write a KB", resolved tickets |
| `skills/m365-user-lifecycle` | Onboarding, role changes, offboarding in the right order | new hire, termination |
| `skills/m365-license-ops` | License inventory, waste, group licensing errors | license review, renewals |
| `skills/m365-security-triage` | Compromised account / phishing containment and evidence | "I clicked a link", alerts |
| `skills/saas-app-admin` | SSO, SCIM, app access reviews, app records | new app, AADSTS errors |
| `skills/destructive-change-approval` | Human-in-the-loop for deletes, wipes, purges, decommissions, security exceptions | any irreversible change |

## Systems projects

| Surface | What it is |
|---|---|
| `skills/systems-project-ops` | Project folder as memory, 7 phases with gates, task format, autonomy levels A-D, session loop |
| `skills/systems-project-ops/templates/` | STATUS, PROJECT (charter), ROADMAP, phase, RAID, DECISIONS, LOG, cutover runbook, as-built |
| `skills/systems-project-ops/playbooks/` | File share/NAS to SharePoint, Intune + Autopilot, MFA + Conditional Access, new tenant build |
| `agents/project-planner.md` | Writes a full project plan into the folder from an intake brief |
| `agents/project-auditor.md` | Read-only health check: evidence, gates, stale blockers, missing rollbacks, DEL records |
| `/project-new` | Intake, create the project folder, draft the plan, stop for charter approval |
| `/project-resume` | Brief on where the project stands, then keep working |
| `/project-gate` | Phase gate review and approval |
| `/project-report` | Weekly internal, client-facing, or closeout package |

Design rationale: [IT-PROJECT-SYSTEM-DESIGN.md](IT-PROJECT-SYSTEM-DESIGN.md).

## Autonomy levels

| Level | Rule |
|---|---|
| A | Read-only work and documentation: done without waiting |
| B | Reversible pilot/test-scope changes: one approval per batch |
| C | Production or user-visible changes: approve each one |
| D | Destructive or irreversible: a `DEL-<nnn>` request with safety checks and a fresh preview, carried out only after the user replies `approve DEL-<nnn>` |

## Install

With the ECC installer, add the component to an existing install:

```bash
./install.sh --profile core --with capability:it-admin
```

Or copy manually for a personal Claude Code setup:

```powershell
Copy-Item -Recurse -Force .\skills\kb-article-writing, .\skills\m365-*, .\skills\saas-app-admin, .\skills\systems-project-ops, .\skills\destructive-change-approval $HOME\.claude\skills\
Copy-Item -Force .\agents\m365-admin.md, .\agents\project-planner.md, .\agents\project-auditor.md $HOME\.claude\agents\
Copy-Item -Force .\commands\project-*.md $HOME\.claude\commands\
```

## Notes

- To let the agents use a Microsoft Learn MCP server, add its tool names to the
  agents' `tools:` line. Without it they verify with `WebFetch` / `WebSearch`.
- `project-auditor` is limited to Read, Grep, Glob on purpose.
- Nothing connects to a tenant on its own; commands are read-only until a change
  plan is approved.
- Facts were checked against Microsoft Learn on 2026-10-23. Test commands on a
  test tenant or a single test user before relying on them.
