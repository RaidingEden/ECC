# Playbook: Intune + Windows Autopilot Rollout

Bring Windows devices under Intune management and set up Autopilot for new and
reset devices. Scope here is cloud-only Entra join; hybrid join needs on-prem AD
and is out of scope for this playbook. Check licensing and feature details on
Microsoft Learn before design sign-off; Autopilot options change often.

## Discovery (phase 1, approval A)
- [ ] Licensing: users have Intune and Entra ID P1 (Business Premium includes both); automatic MDM enrollment needs P1
- [ ] Device inventory: model, age, Windows edition (Pro/Enterprise/Business; Home is not supported), Windows version, TPM, who uses it
- [ ] Current join state of each device (`dsregcmd /status` on a sample: workgroup, Entra joined, Entra registered, domain joined)
- [ ] Existing management: other RMM/MDM, GPOs, local admin rights users rely on
- [ ] Apps every user needs, and how they're installed today (installer location, licensing keys, silent install switches)
- [ ] Devices that may still be registered to another tenant (bought used, previous MSP) - these block Autopilot registration until released
- [ ] Current Conditional Access: anything requiring compliant devices will lock people out if compliance isn't ready first

```powershell
Connect-MgGraph -Scopes "DeviceManagementManagedDevices.Read.All","Organization.Read.All"
Get-MgDeviceManagementManagedDevice -All |
  Select-Object DeviceName, OperatingSystem, OsVersion, Model, ComplianceState, UserPrincipalName, LastSyncDateTime |
  Export-Csv .\evidence\discovery\intune-devices.csv -NoTypeInformation
```

## Design decisions (phase 2)
- Enrollment path per device group: Autopilot for new/reset devices; enrolling existing devices in place (no wipe) vs resetting them
- Autopilot registration method: hardware hash upload, or OEM/reseller registration for new purchases; evaluate whether Windows Autopilot device preparation fits better
- Device naming convention (e.g. `<CLIENT>-<SERIAL>`)
- Local admin: users standard, with Windows LAPS for the local admin account
- Baseline policies: BitLocker, Windows Update rings, Defender, firewall, security baseline, OneDrive Known Folder Move
- Compliance policies and grace period, and **when** Conditional Access starts requiring compliance (after devices are compliant, never before)
- App deployment list and order (M365 Apps, line-of-business apps, browser, PDF, VPN)
- Enrollment Status Page: which apps block the desktop until installed

## Build & Pilot (phase 3)
- [ ] Create device groups: pilot, wave groups, Autopilot devices (B)
- [ ] Configuration and compliance policies assigned to pilot only (B)
- [ ] Package and assign apps to pilot (B)
- [ ] Register pilot device hardware hashes; assign Autopilot profile (B)
- [ ] Pilot: reset or provision 2-3 IT devices, then 3-5 user devices; time the full provisioning
- [ ] End-user KB: "Setting up your new laptop" and "What changes for you" (`kb-article-writing`)
- [ ] Runbook for device provisioning and for enrolling existing devices

## Rollout (phase 4)
- Waves by department; policies and apps assigned to each wave group as it starts
- Device resets and wipes are approval level D: a `DEL-<nnn>` request listing each device by name and serial, with the user's data confirmed backed up (OneDrive Known Folder Move verified) (`destructive-change-approval`)

## Validation
- Device shows compliant in Intune; policies report success, not just "pending"
- User signs in, apps present, OneDrive known folders redirected, BitLocker key escrowed to Entra

## Gotchas
- Compliance + Conditional Access turned on together = Monday morning lockouts; separate them by at least a week
- Devices registered to a previous tenant must be deregistered by that tenant or the OEM
- ESP timeouts usually mean a blocking app failed; check the app's install status first
- Users with local admin today will notice losing it; communicate before, not after
