# Playbook: New Microsoft 365 Tenant Build

Stand up a new tenant ready for users: domains, admin model, security baseline,
mail authentication, and collaboration structure. Moving data in from an old
system is a separate project (or a separate phase) with its own playbook.

## Discovery (phase 1, approval A)
- [ ] Organization details: legal name, domains owned, DNS host and who controls it
- [ ] User list: names, titles, departments, managers, start dates
- [ ] License plan per user type (and budget)
- [ ] Existing mail system and any mail flowing through third-party email security filters
- [ ] Compliance or industry requirements (retention, HIPAA, financial records)
- [ ] Apps that need SSO or integration later (feed `saas-app-admin`)

## Design decisions (phase 2)
- Tenant name (`<name>.onmicrosoft.com` cannot be changed later - confirm spelling with the client)
- Admin model: two break-glass Global Admin accounts; named admin accounts separate from daily-use accounts; least-privilege roles for technicians
- Identity baseline: security defaults, or Conditional Access if P1 licensed (see `mfa-conditional-access-rollout.md`)
- Mail authentication: SPF, DKIM, DMARC policy and reporting address; DMARC starts at `p=none` and tightens after reports are clean
- Groups model: Microsoft 365 groups/Teams per department, security groups for licensing and access
- SharePoint/Teams structure and external sharing level
- Device management approach (feeds `intune-autopilot-rollout.md`)
- Naming conventions for groups, Teams, devices, policies

## Build (phase 3)
- [ ] Create tenant; record tenant ID and domain in PROJECT.md (C)
- [ ] Create break-glass accounts; test sign-in; store per client policy (C)
- [ ] Add and verify domains; set MX, autodiscover, SPF; enable DKIM; publish DMARC (C - DNS changes affect mail)
- [ ] Confirm unified audit logging is on (A to check, B to enable)
- [ ] Identity baseline in place before any users are licensed (B/C)
- [ ] Create groups, licensing groups, users (B)
- [ ] Shared mailboxes, distribution lists, resource mailboxes (B)
- [ ] SharePoint sites / Teams; set sharing policy (B)
- [ ] Mail security layer configured (Defender for Office 365 policies or a third-party email security connection) (C)
- [ ] Pilot with IT and 2-3 users: sign-in, MFA, mail in/out, Teams, file access

## Rollout (phase 4)
- Onboard users by wave with `m365-user-lifecycle`
- If mail is moving from another system, MX cutover is a runbook with a go/no-go (`templates/runbook-cutover.md`)

## Validation
- Mail to and from external addresses passes SPF/DKIM/DMARC (check message headers)
- MFA enforced for all users; break-glass excluded and tested
- Secure Score reviewed and recommendations triaged into RAID.md or a follow-up project

## Gotchas
- DNS TTLs: lower them days before an MX change
- A tenant built "temporarily" with default settings becomes production; apply the baseline first
- Don't make the client's daily-use account a Global Admin
