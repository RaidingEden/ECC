---
name: saas-app-admin
description: Administer third-party business apps connected to Microsoft 365 - Entra ID single sign-on, SCIM provisioning, app role assignment, access reviews, vendor admin portals, and app onboarding/offboarding. Use when adding a new SaaS app for a client, troubleshooting SSO or provisioning, cleaning up app access, or documenting how an app is administered.
metadata:
  origin: community
---

# SaaS App Admin

Every client runs a handful of apps outside Microsoft 365: a PSA or ITSM, an
accounting package, a CRM, an e-signature tool, a line-of-business app. Each
one is another place a departed user can keep access.

## When to Activate

- Client wants to add a new app ("can we get everyone on <app> with Microsoft login?")
- SSO errors ("AADSTS..." codes, redirect loops, "user not assigned")
- Provisioning problems (users not created, not deactivated, wrong role)
- Access review: who has access to what, especially admins
- Writing the "how this app is administered" page for the client's documentation

## App Onboarding Checklist

- [ ] **Owner:** who at the client owns the app and approves access?
- [ ] **Licensing model:** per seat, per admin, tiered? Who pays?
- [ ] **SSO support:** SAML, OIDC, or none? Is SSO a paid tier at the vendor?
- [ ] **Provisioning:** SCIM supported? If not, user creation and removal are manual and must be on the lifecycle checklist
- [ ] **Assignment:** assign by security group, never one user at a time
- [ ] **Admin accounts:** at least two named admins; one break-glass local admin stored in the password manager, not in a ticket
- [ ] **MFA:** enforced through Entra Conditional Access (with SSO) or in the app itself (without)
- [ ] **Data:** what client data lives there, and can it be exported if they leave the vendor?
- [ ] **Documentation:** app record written (template below)

## Entra Enterprise App Review (read-only)

```powershell
Connect-MgGraph -Scopes "Application.Read.All","Directory.Read.All"

# Enterprise apps in the tenant
Get-MgServicePrincipal -All -Filter "tags/any(t:t eq 'WindowsAzureActiveDirectoryIntegratedApp')" |
  Select-Object DisplayName, AppId, AccountEnabled, AppRoleAssignmentRequired

# Who is assigned to a given app
$sp = Get-MgServicePrincipal -Filter "displayName eq 'Contoso CRM'"
Get-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId $sp.Id -All |
  Select-Object PrincipalDisplayName, PrincipalType
```

`AppRoleAssignmentRequired = False` means anyone in the tenant can sign in to
that app. That is usually not what the client wants; flag it.

## SSO Troubleshooting

1. Get the exact error and the AADSTS code from the user's screen or the sign-in log.
2. Look up the code in Microsoft Learn ("Microsoft Entra authentication and authorization error codes"). Do not guess from memory.
3. Common patterns:
   - User not assigned to the app -> add them to the assignment group
   - Reply URL / ACS URL mismatch -> compare the vendor's SAML settings to the enterprise app
   - Expired SAML signing certificate -> check the certificate expiry on the enterprise app; renewing it needs the new cert uploaded at the vendor (coordinate a time, it breaks SSO until both sides match)
   - Identifier (Entity ID) mismatch after the vendor changed tenants or regions
4. Test with a pilot user before changing anything tenant-wide.

## Provisioning Troubleshooting

- Check the provisioning logs on the enterprise app for the specific user
- Attribute mapping errors (missing email, wrong UPN format) are the usual cause
- Deprovisioning: confirm what the app does on "disable" vs "delete"; some apps free the seat only on delete

## App Record Template

```markdown
# <App name> - <Client>

**Owner at client:** <name, role>
**Vendor support:** <portal / phone / account number location (not the password)>
**License:** <model, count, renewal date>
**Sign-in:** <Entra SSO (SAML/OIDC) | local accounts>
**Provisioning:** <SCIM automatic | manual - on lifecycle checklist>
**Access group:** <Entra group name>
**Admins:** <named admins>; break-glass account in <password manager vault>
**SAML cert expires:** <date> (calendar reminder 30 days before)

## Add a user
<steps>

## Remove a user
<steps; note whether disable frees the seat>

## Known issues
- <issue -> fix / KB link>
```

## Output Format

```text
APP - <name> - <client>

CURRENT STATE
- SSO / provisioning / assignment model / admin count

ISSUES
- <finding> - risk: <who could access what>

ACTIONS (need approval)
1. <change> - rollback: <how>

DOCUMENTATION
- app record created/updated: <yes/no>
```

## Good Use Cases

- "Client wants Microsoft sign-in for <app>; what do we need?"
- "Users get AADSTS50105 signing into <app>"
- "Which apps still let departed users in?"
- "Document how we administer <app> for <client>"

## Anti-Patterns

- Assigning app access to individual users instead of a group
- Leaving "assignment required" off so anyone in the tenant can sign in
- Only one admin on a vendor portal, or the break-glass password stored in a ticket
- Renewing a SAML certificate on one side only (breaks SSO until both match)
- Apps without SCIM that never make it onto the offboarding checklist

## Related Skills

- `m365-user-lifecycle` - app accounts in onboarding and offboarding
- `kb-article-writing` - app records and user how-tos
- `destructive-change-approval` - removing an app and its data
