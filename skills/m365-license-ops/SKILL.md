---
name: m365-license-ops
description: Audit and manage Microsoft 365 licensing - SKU inventory, unused and wasted seats, licenses on disabled or departed users, group-based licensing errors, and right-sizing recommendations. Use for monthly license reviews, client cost questions, renewal prep, and "why can't I assign a license" tickets.
metadata:
  origin: community
---

# M365 License Ops

Licenses are the line item clients notice. A monthly review that catches
three wasted Business Premium seats pays for itself.

## When to Activate

- Monthly or quarterly license review per client
- Renewal or true-up prep
- "Can't assign a license" / "user has no mailbox" tickets
- Client asks "what are we paying for and do we need it?"

## Workflow

### 1. Inventory (read-only)

```powershell
Connect-MgGraph -Scopes "Organization.Read.All","User.Read.All","AuditLog.Read.All"

# What the tenant owns vs uses
Get-MgSubscribedSku | Select-Object SkuPartNumber,
  @{n='Purchased';e={$_.PrepaidUnits.Enabled}},
  @{n='Assigned';e={$_.ConsumedUnits}},
  @{n='Free';e={$_.PrepaidUnits.Enabled - $_.ConsumedUnits}}
```

SKU part numbers are not friendly names (`SPB` is Business Premium,
`O365_BUSINESS_PREMIUM` is Business Standard). Use Microsoft's published
"Product names and service plan identifiers for licensing" list to translate
them for the client report; do not guess.

### 2. Find waste

```powershell
$users = Get-MgUser -All -Property UserPrincipalName,AccountEnabled,AssignedLicenses,SignInActivity,UserType

# Licensed but disabled
$users | Where-Object { -not $_.AccountEnabled -and $_.AssignedLicenses.Count -gt 0 } |
  Select-Object UserPrincipalName

# Licensed but no sign-in in 60+ days (SignInActivity needs Entra ID P1)
$cutoff = (Get-Date).AddDays(-60)
$users | Where-Object { $_.AssignedLicenses.Count -gt 0 -and $_.SignInActivity.LastSignInDateTime -lt $cutoff } |
  Select-Object UserPrincipalName, @{n='LastSignIn';e={$_.SignInActivity.LastSignInDateTime}}

# Shared mailboxes that are licensed (often unnecessary under 50 GB)
Connect-ExchangeOnline -ShowBanner:$false
Get-EXOMailbox -RecipientTypeDetails SharedMailbox -ResultSize Unlimited |
  ForEach-Object { $u = Get-MgUser -UserId $_.ExternalDirectoryObjectId -Property AssignedLicenses
    if ($u.AssignedLicenses.Count) { $_.PrimarySmtpAddress } }
```

Before calling something waste, check the exceptions:
- Service accounts, room/resource mailboxes, and break-glass admins may sign in rarely on purpose
- Litigation Hold or archives over 50 GB need a license on a shared mailbox
- Users on leave are not leavers; confirm with the client

### 3. Group-based licensing errors

```powershell
Get-MgGroup -All -Property DisplayName,AssignedLicenses |
  Where-Object { $_.AssignedLicenses.Count } |
  ForEach-Object {
    $errs = Get-MgGroupMemberWithLicenseError -GroupId $_.Id -All
    if ($errs) { "$($_.DisplayName): $($errs.Count) member(s) with license errors" }
  }
```

Common causes: no free seats, missing usage location, conflicting service plans
(two SKUs with the same Exchange plan), or a dependent service plan disabled.

### 4. Recommend, don't remove

License changes affect billing and access. Produce a recommendation the client
or account manager approves. Removal steps come from `m365-user-lifecycle`.

## Output Format

```text
LICENSE REVIEW - <client> - <YYYY-MM>

INVENTORY
| Product (friendly name) | Purchased | Assigned | Free |

FINDINGS
- <n> licenses on disabled accounts: <list>
- <n> licensed users inactive 60+ days: <list>  (confirm before acting)
- <n> licensed shared mailboxes under 50 GB: <list>
- group licensing errors: <group: cause>

RECOMMENDATIONS
1. <action> - est. monthly saving: <only if you know the client's price; otherwise leave blank>
2. <seats to reduce at renewal>

NEEDS CLIENT CONFIRMATION
- <users who may be on leave, service accounts, etc.>
```

## Good Use Cases

- "Run the monthly license review for <client>"
- "Why does this user say 'no license'? It's assigned through a group"
- "Client renews in 30 days; how many seats do they actually need?"

## Anti-Patterns

- Calling a license "wasted" without checking for service accounts, rooms, break-glass admins, or users on leave
- Removing licenses directly instead of producing a recommendation for approval
- Guessing friendly product names from SKU part numbers
- Removing a license from a shared mailbox that is on hold or over 50 GB

## Related Skills

- `m365-user-lifecycle` - the safe order for removing licenses from leavers
- `systems-project-ops` - license consolidation as a project
