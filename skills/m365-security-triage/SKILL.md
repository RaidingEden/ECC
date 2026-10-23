---
name: m365-security-triage
description: Triage suspected compromised Microsoft 365 accounts, phishing reports, and suspicious mail activity - sign-in review, malicious inbox rules, forwarding, OAuth app consents, and containment steps - alongside the tenant's mail security layer (Defender for Office 365 or a third-party email security product). Use when a user clicked a link, entered credentials, is sending spam, or a security alert fires.
metadata:
  origin: community
---

# M365 Security Triage

The goal of the first hour is containment and evidence, not root cause. Lock
the door, then figure out how they got in.

## When to Activate

- "I clicked a link and entered my password"
- Contacts report spam or invoice-fraud emails from a user's account
- Impossible-travel, risky sign-in, or mail-security alert
- Unexpected inbox rules, forwarding, or MFA methods found during another ticket

## Severity Quick Check

| Signal | Severity |
|---|---|
| Credentials entered, no evidence of use | Medium - reset and watch |
| Successful sign-in from unknown location/IP | High - contain now |
| New inbox rules hiding mail, external forwarding, or new MFA method | High - contain now |
| Outbound phishing from the account, finance/payment thread involved | Critical - contain, then notify client leadership |

## Workflow

### 1. Contain (with approval, but fast)

Containment steps are reversible, so propose them immediately:

```powershell
Connect-MgGraph -Scopes "User.ReadWrite.All","User.RevokeSessions.All","UserAuthenticationMethod.Read.All","AuditLog.Read.All"
Connect-ExchangeOnline -ShowBanner:$false
$upn = "victim@contoso.com"

Update-MgUser -UserId $upn -AccountEnabled:$false   # block sign-in
Revoke-MgUserSignInSession -UserId $upn              # kill existing tokens
# Reset password in the admin center; tell the user out-of-band (phone), never by email to that mailbox
```

### 2. Collect evidence (read-only)

```powershell
# Sign-ins: look for unfamiliar IPs, countries, legacy auth, or success after many failures
Get-MgAuditLogSignIn -Filter "userPrincipalName eq '$upn'" -Top 100 |
  Select-Object CreatedDateTime, IpAddress, @{n='Location';e={"$($_.Location.City), $($_.Location.CountryOrRegion)"}},
    AppDisplayName, ClientAppUsed, @{n='Result';e={$_.Status.ErrorCode}}

# Inbox rules: attackers hide replies (move to RSS Feeds/Archive, delete, mark read)
Get-InboxRule -Mailbox $upn | Format-List Name, Enabled, Description, ForwardTo, RedirectTo, DeleteMessage, MoveToFolder, MarkAsRead

# Forwarding at the mailbox level
Get-EXOMailbox -Identity $upn -Properties ForwardingSmtpAddress, ForwardingAddress, DeliverToMailboxAndForward

# MFA methods: an attacker-added phone or authenticator is a persistence foothold
Get-MgUserAuthenticationMethod -UserId $upn | Select-Object Id, @{n='Type';e={$_.AdditionalProperties.'@odata.type'}}

# OAuth apps the user consented to (illicit consent grants)
Get-MgUserOauth2PermissionGrant -UserId (Get-MgUser -UserId $upn).Id | Select-Object ClientId, Scope

# What the account sent (last 10 days)
Get-MessageTraceV2 -SenderAddress $upn -StartDate (Get-Date).AddDays(-3) -EndDate (Get-Date) |
  Select-Object Received, RecipientAddress, Subject, Status

# Deeper history (requires audit logging, enabled by default in most tenants)
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -UserIds $upn -ResultSize 500
```

Also check the mail security layer (Defender quarantine, or the third-party product's event log) for
the original phishing message and whether other users received it.

### 3. Eradicate (after evidence is saved)

- Remove malicious inbox rules and forwarding (export them to the ticket first)
- Remove attacker-added MFA methods; have the user re-register in person or by verified phone call
- Revoke suspicious OAuth grants
- Purge the phishing message from other mailboxes via the mail security tool or Defender
- Block the sender/domain/URL in the mail security layer

### 4. Recover and follow up

- Re-enable the account only after password reset and clean MFA
- Notify recipients if phishing went out from the account (client decides the wording)
- If a payment or invoice thread was involved, the client must call their bank and the vendor by phone now
- Write it up: timeline, what was found, what was changed. Consider a short end-user KB on spotting the lure used.

## Hard Rules

- Never email the user at the compromised mailbox with new credentials or instructions
- Save evidence before deleting rules or messages
- Do not disable audit logging, MFA, or mail filtering to "test"
- Escalate to the client's cyber-insurance or incident response contact when money moved or data left

## Output Format

```text
SECURITY TRIAGE - <client> - <user> - Severity: <Medium/High/Critical>

TIMELINE
- <UTC time> <event, source>

INDICATORS FOUND
- sign-ins: <IP / location / app>
- rules/forwarding: <details>
- MFA changes: <details>
- OAuth grants: <details>
- outbound mail: <count, recipients, subject>

CONTAINMENT DONE / PENDING APPROVAL
- [x] / [ ] <step>

ERADICATION PLAN
1. <step> - rollback/evidence saved: <where>

CLIENT COMMUNICATION
<2-3 plain sentences for the client contact>
```

## Good Use Cases

- "Sarah clicked a fake DocuSign link and typed her password"
- "Vendors are getting weird invoice emails from our AP mailbox"
- "Our email security tool flagged an account-takeover alert on a user at <client>"

## Anti-Patterns

- Investigating for an hour before containing an account with a successful attacker sign-in
- Emailing new credentials or instructions to the compromised mailbox
- Deleting malicious inbox rules before exporting them as evidence
- Re-enabling the account before attacker-added MFA methods are removed
- Turning off MFA or mail filtering to "see if it helps"

## Related Skills

- `destructive-change-approval` - purges and security-control exceptions
- `kb-article-writing` - end-user article on spotting the lure that was used
- `m365-user-lifecycle` - if the incident ends in an offboarding
