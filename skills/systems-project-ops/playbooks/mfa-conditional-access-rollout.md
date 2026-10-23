# Playbook: MFA and Conditional Access Rollout

Move a tenant from no MFA, per-user MFA, or security defaults to a designed set
of Conditional Access policies. Facts below were checked on Microsoft Learn on
2026-10-23: Conditional Access needs Entra ID P1; security defaults and
Conditional Access can't be used together; Microsoft recommends two cloud-only
emergency access (break-glass) accounts excluded from policies.

## Discovery (phase 1, approval A)
- [ ] Licensing: every user covered by Entra ID P1 (Business Premium includes it)
- [ ] Current state: security defaults on/off, per-user MFA states, existing CA policies (export each one)
- [ ] MFA registration: who has registered which methods
- [ ] Legacy authentication in use: sign-ins with old client apps (IMAP, POP, SMTP AUTH, older Office)
- [ ] Non-human sign-ins: service accounts, shared accounts, **scanners/copiers sending mail with SMTP AUTH**, line-of-business apps
- [ ] Admin accounts: who holds which roles; are admins using separate admin accounts
- [ ] Guests and external users
- [ ] Where users work from (countries), if location-based policies are wanted

```powershell
Connect-MgGraph -Scopes "Policy.Read.All","AuditLog.Read.All","Directory.Read.All","UserAuthenticationMethod.Read.All"

# Existing Conditional Access policies
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State, CreatedDateTime

# Security defaults on?
(Get-MgPolicyIdentitySecurityDefaultEnforcementPolicy).IsEnabled

# MFA registration per user
Get-MgReportAuthenticationMethodUserRegistrationDetail -All |
  Select-Object UserPrincipalName, IsMfaRegistered, IsMfaCapable, MethodsRegistered |
  Export-Csv .\evidence\discovery\mfa-registration.csv -NoTypeInformation

# Legacy auth sign-ins (last few days)
Get-MgAuditLogSignIn -Filter "createdDateTime ge $((Get-Date).AddDays(-7).ToString('yyyy-MM-ddTHH:mm:ssZ'))" -All |
  Where-Object { $_.ClientAppUsed -notin @('Browser','Mobile Apps and Desktop clients') } |
  Select-Object UserPrincipalName, ClientAppUsed, AppDisplayName, IpAddress |
  Export-Csv .\evidence\discovery\legacy-auth.csv -NoTypeInformation
```

## Design decisions (phase 2)
- Policy set and naming, for example:
  - `CA01 - Block legacy authentication - All users`
  - `CA02 - Require MFA - All users`
  - `CA03 - Require phishing-resistant MFA - Admin roles`
  - `CA04 - Require MFA for Azure/admin portals`
  - Later, separate project: require compliant device (after Intune is in place)
- Exclusion group for the two break-glass accounts (and documented service exceptions, each with an expiry date)
- Authentication methods allowed (Authenticator push with number matching, passkeys/FIDO2 for admins; SMS only as a fallback if at all)
- Registration approach: registration campaign, Temporary Access Pass for people who can't self-register
- What happens to scanners and apps that can't do MFA (move to a supported send method or a narrowly scoped exception)

## Build & Pilot (phase 3)
- [ ] Create and test two break-glass accounts; store credentials per client policy (never in project files) (C)
- [ ] Create policies in **report-only** mode (B)
- [ ] Review report-only results and the What If tool for 1-2 weeks; log every unexpected block in RAID.md
- [ ] Fix legacy auth users and scanners before enforcing
- [ ] Pilot: turn policies on for an IT + friendly-user group (C)
- [ ] End-user KB: "Setting up Microsoft Authenticator" and "Got a new phone?" (`kb-article-writing`)

## Rollout (phase 4)
- Registration first (users enrolled and capable), enforcement second
- Enforce by waves using an include group that grows; finish by switching the include to All users with the exclusion group
- If security defaults are being replaced, disable them only in the same change window where the replacement policies are turned on, so the tenant is never unprotected
- Migrate per-user MFA users to CA, then clear per-user MFA states

## Validation
- Sign-in logs show CA policies applied with expected results
- No legacy-auth successes after enforcement
- Break-glass sign-in tested and alert configured for its use

## Gotchas
- SMTP AUTH from copiers is the classic day-one breakage
- Users with no registered method get stuck; have a TAP process ready on enforcement day
- Executives travelling abroad + location policies = an urgent call; plan exceptions ahead
- An excluded account is an unprotected account; give every exception an owner and an expiry date
