---
name: kb-article-writing
description: Write and maintain IT knowledge base articles for end users and technicians in an ITSM/PSA knowledge base, SharePoint, a wiki, or a documentation platform. Use when turning a resolved ticket, a fix, a how-to, or a process into a reusable article, or when reviewing an existing article for accuracy, staleness, or readability.
metadata:
  origin: community
---

# KB Article Writing

A good KB article lets the next person fix the problem without asking anyone.
Write for the reader who is stressed, in a hurry, and skimming.

## When to Activate

- A ticket was resolved and the fix is likely to come up again
- A client needs an end-user how-to (MFA setup, shared mailbox in Outlook, OneDrive sync, printer, VPN)
- A technician process needs a runbook (onboarding, offboarding, license cleanup, migration step)
- An existing article needs a review: wrong screenshots, renamed admin center menus, deprecated cmdlets

## Pick the Audience First

| Audience | Voice | Include | Leave out |
|---|---|---|---|
| **End user** | Plain words, "you", short steps | What they will see, what to click, what success looks like | Admin centers, PowerShell, root cause jargon |
| **Technician** | Precise, imperative | Prerequisites, roles needed, commands, rollback, escalation path | Hand-holding on basic navigation |

Never mix both in one article. If both need it, write two and link them.

## Workflow

### 1. Gather the facts

- The exact symptom and error text, as the user saw it
- Which client(s) and which environment it applies to (tenant, app version, OS)
- The fix that actually worked, in order, from the ticket notes
- Anything that did NOT work (saves the next tech time)

### 2. Check before you write

- Search the KB for an existing article. Update it rather than creating a duplicate.
- Verify admin center paths and cmdlets against current Microsoft Learn docs. Microsoft renames menus often.
- Strip anything client-confidential: real user names, email addresses, IPs, license counts, screenshots showing other users. Use `user@contoso.com` style placeholders.

### 3. Write it using the template

### 4. Self-review checklist

- [ ] Title matches what a user would search for (the symptom, not the cause)
- [ ] Every step is one action; numbered; starts with a verb
- [ ] Each step that changes something says what success looks like
- [ ] No secrets, real names, or tenant-identifying details
- [ ] "Applies to" is filled in, so stale articles are easy to spot
- [ ] Reading level: a new hire could follow it without asking

## Template

```markdown
# <Symptom or task, in the user's words>
<!-- e.g. "Outlook keeps asking for my password" not "Modern auth token cache corruption" -->

**Applies to:** <client(s) / all clients> - <app or service> - <OS if relevant>
**Audience:** <End user | Technician>
**Last verified:** <YYYY-MM-DD> by <initials>

## Summary
<One or two sentences: what this fixes and roughly how long it takes.>

## Before you start
- <Prerequisite, role, or access needed>
- <Anything to back up or tell the user first>

## Steps
1. <Verb-first action.>
   - You should see: <expected result>
2. <Next action.>

## If that didn't work
- <Most common alternate cause and fix>
- Escalate to <tier / team / vendor> with: <what info to include>

## Rollback (technician articles only)
<How to undo the change.>

## Related
- <Link to related KB>
- <Microsoft Learn reference>
```

## Output Format

```text
ARTICLE
- title
- audience
- new article or update to: <existing title>

DRAFT
<the article in markdown, using the template>

REVIEW NOTES
- facts I could not verify / need a screenshot for
- confidential details removed
- suggested tags / category
```

## Good Use Cases

- "Turn this ticket into a KB article for the client's staff"
- "Write a tech runbook for offboarding at <client>"
- "Review our MFA setup article; Microsoft changed the Authenticator flow"
- "We fixed the same OneDrive sync issue three times this month. Write it up."

## Anti-Patterns

- Writing the cause as the title ("Token cache corruption") instead of the symptom users search for
- One article for both end users and technicians
- Pasting real user names, email addresses, or tenant details from the ticket
- Creating a new article when an existing one only needs updating
- Steps without "you should see", so the reader cannot tell if a step worked

## Related Skills

- `m365-user-lifecycle`, `m365-security-triage`, `saas-app-admin` - common sources of KB-worthy fixes
- `systems-project-ops` - project closeout turns KB candidates into articles
