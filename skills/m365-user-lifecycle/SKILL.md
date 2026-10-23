---
name: m365-user-lifecycle
description: Onboard, change, and offboard Microsoft 365 users safely - account creation, licensing, groups, mailbox access, devices, and departure handling including shared mailbox conversion and OneDrive handoff. Use for new hire setup, role changes, terminations, and auditing whether past offboardings were completed.
metadata:
  origin: community
---

# M365 User Lifecycle

Onboarding gets someone working on day one. Offboarding protects the company
the moment someone leaves. Both should be checklists, never memory.

## When to Activate

- New hire request ("start Monday, same access as Jane")
- Role or department change (groups, shared mailboxes, app access move with the person)
- Termination, planned or immediate
- Audit: "did we actually finish offboarding the people who left last quarter?"

## Onboarding

### Gather first

- Legal name, display name, UPN format the client uses, start date, manager, department, job title, location
- License (confirm the client's standard SKU; check available seats before promising)
- Groups, Teams, shared mailboxes, distribution lists, SharePoint sites
- Line-of-business apps that need their own accounts (hand off to `saas-app-admin`)
- Device: new Autopilot device, reassigned device, or BYOD

"Same as Jane" is a starting point, not a spec. Pull Jane's memberships and
confirm with the manager; copying access copies Jane's mistakes too.

```powershell
# Model user's access (read-only)
Get-MgUserMemberOf -UserId jane@contoso.com -All | ForEach-Object { $_.AdditionalProperties.displayName }
Get-MgUserLicenseDetail -UserId jane@contoso.com | Select-Object SkuPartNumber

# Seats available?
Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{n='Total';e={$_.PrepaidUnits.Enabled}}
```

### Checklist

- [ ] Account created with correct UPN, usage location set (required before licensing)
- [ ] License assigned (prefer group-based licensing where the client uses it)
- [ ] Groups / Teams / shared mailboxes / DLs added
- [ ] MFA registration path confirmed (Temporary Access Pass or first-sign-in registration)
- [ ] Device enrolled or assigned in Intune / Autopilot
- [ ] LOB app accounts requested
- [ ] Welcome info sent to the manager, not the user's new mailbox they cannot reach yet
- [ ] Ticket note written

## Offboarding

### Order matters

Do these in order. Converting the mailbox BEFORE removing the license is what
keeps the mail. Removing the license first starts a 30-day clock on the
mailbox being deleted.

| # | Step | Why | Reversible? |
|---|---|---|---|
| 1 | Confirm with HR/manager: last day, who gets mail/files, immediate or end-of-day | Avoid locking out the wrong person or at the wrong time | - |
| 2 | Block sign-in | Stops new logins | Yes |
| 3 | Revoke sessions | Kills existing tokens on phones/laptops | Yes (they just sign in again if re-enabled) |
| 4 | Reset password | Stops the old password working on a converted shared mailbox | Yes |
| 5 | Remove MFA methods / registered devices | Prevents re-registration abuse | Yes, user re-registers |
| 6 | Check inbox rules and forwarding | Departing users sometimes set forwarding to personal mail | Yes |
| 7 | Convert mailbox to shared, grant Full Access to manager | Keeps mail without a license (under 50 GB) | Yes |
| 8 | Set auto-reply if requested | Tells senders who to contact | Yes |
| 9 | Grant manager access to OneDrive | OneDrive is deleted after the retention period once the account is deleted | Yes |
| 10 | Remove from groups, Teams ownership transfer, DLs | Clean access | Yes, from your notes |
| 11 | Retire or wipe devices in Intune | Company data off the device | **Wipe is irreversible** - `destructive-change-approval` |
| 12 | Remove license | Save cost | Yes, but only safe after step 7 |
| 13 | Disable LOB app accounts | Access outside M365 | Varies |
| 14 | Do NOT delete the account | It anchors the shared mailbox | - |

### Commands (run only after the plan is approved)

```powershell
Connect-MgGraph -Scopes "User.ReadWrite.All","User.RevokeSessions.All","UserAuthenticationMethod.ReadWrite.All"
Connect-ExchangeOnline -ShowBanner:$false
$upn = "leaver@contoso.com"

# 2-4: lock out
Update-MgUser -UserId $upn -AccountEnabled:$false
Revoke-MgUserSignInSession -UserId $upn
# Reset the password in the admin center (generates a random one you never need to see)

# 6: forwarding and rules - record before changing
Get-EXOMailbox -Identity $upn -Properties ForwardingSmtpAddress,DeliverToMailboxAndForward
Get-InboxRule -Mailbox $upn | Where-Object { $_.ForwardTo -or $_.RedirectTo -or $_.ForwardAsAttachmentTo }

# 7: shared mailbox + manager access
Get-EXOMailboxStatistics -Identity $upn | Select-Object TotalItemSize   # must be under 50 GB to drop the license
Set-Mailbox -Identity $upn -Type Shared
Add-MailboxPermission -Identity $upn -User manager@contoso.com -AccessRights FullAccess -AutoMapping $true

# 8: auto-reply
Set-MailboxAutoReplyConfiguration -Identity $upn -AutoReplyState Enabled `
  -InternalMessage "I am no longer with Contoso. Please contact manager@contoso.com." `
  -ExternalMessage "I am no longer with Contoso. Please contact manager@contoso.com."

# 12: remove license (after confirming RecipientTypeDetails = SharedMailbox)
Get-EXOMailbox -Identity $upn | Select-Object RecipientTypeDetails
$skus = (Get-MgUserLicenseDetail -UserId $upn).SkuId
Set-MgUserLicense -UserId $upn -AddLicenses @() -RemoveLicenses $skus
```

Notes:
- Licenses assigned through a group cannot be removed with `Set-MgUserLicense`; remove the user from the licensing group instead.
- A mailbox on Litigation Hold or over 50 GB needs a license to stay; flag it rather than forcing the removal.
- If the account is synced from on-prem AD, the block/disable step belongs on-prem.

## Output Format

```text
LIFECYCLE: <Onboard | Change | Offboard> - <name> - <client>

CONFIRMED DETAILS
- start/last day, manager, license, access source

PLAN
- [ ] step - command or admin center path - rollback

FLAGS
- seat shortage / litigation hold / >50 GB mailbox / synced account / device wipe needs sign-off

TICKET NOTE
<what was done, by when, what is still pending>
```

## Good Use Cases

- "New hire at <client> Monday, same as Jane in accounting"
- "Term effective immediately - Mark, sales"
- "List every disabled user who still has a license"
- "Make me an offboarding KB for <client>" (pair with `kb-article-writing`)

## Anti-Patterns

- Removing the license before converting the mailbox to shared (starts the mailbox deletion clock)
- Deleting the departed user account (it anchors the shared mailbox)
- Copying "same as Jane" access without confirming it with the manager
- Emailing new-hire credentials to a mailbox they cannot reach yet
- Wiping a device before confirming the user's data is backed up

## Related Skills

- `m365-license-ops` - seat checks and cleanup after offboarding
- `saas-app-admin` - accounts outside Microsoft 365
- `destructive-change-approval` - device wipes and any permanent deletion
- `kb-article-writing` - client-specific onboarding/offboarding runbooks
