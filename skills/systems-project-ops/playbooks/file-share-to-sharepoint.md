# Playbook: File Share / NAS to SharePoint

Move on-prem file shares (Windows server or Linux/NAS) into SharePoint and Teams.
Limits below were checked on Microsoft Learn on 2026-10-23; re-check before design sign-off.

## Limits that shape the design
- **400 characters** max for the full decoded path (site URL path + library + folders + file name).
- **250 GB** max file size.
- **300,000 items** across all libraries a user syncs is the OneDrive sync soft limit; past it, sync slows down. Design so nobody syncs everything.
- **100,000 items** in a library or folder blocks breaking or restoring permission inheritance on it. Plan permissions at the site/library level, not deep folders.
- **Migration Manager** (SharePoint admin center > Migration) is Microsoft's tool for file share migrations at scale; SPMT also supports file shares and is fine for small jobs.

## Discovery (phase 1, approval A)
Export everything to `evidence/discovery/`.

- [ ] Share list with owner, size, file count, last-modified spread
- [ ] Long paths: anything that will exceed ~400 chars after adding the destination prefix
- [ ] Invalid characters and names (`" * : < > ? / \ |`, leading/trailing spaces, reserved names like `CON`, `.lock`, `desktop.ini`)
- [ ] Stale data: files not modified in 3+ years (candidates to archive instead of migrate)
- [ ] Permissions: export NTFS ACLs at the top 2-3 folder levels; note any per-user grants
- [ ] Apps that depend on UNC paths: QuickBooks company files, Access databases, CAD with linked references, Excel files linking to other files, scanners saving to a share, scripts or scheduled tasks
- [ ] How users reach the shares today: GPO drive maps, logon scripts, Intune, shortcuts

Windows file server (PowerShell, run from a machine with read access):

```powershell
$root = '\\fileserver\Shares'
$destPrefixLen = ('/sites/Finance/Shared Documents/').Length   # adjust to the planned destination
Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object FullName, Length, LastWriteTime,
    @{n='DestPathLen';e={ $_.FullName.Length - $root.Length + $destPrefixLen }} |
  Export-Csv .\evidence\discovery\files.csv -NoTypeInformation

Import-Csv .\evidence\discovery\files.csv | Where-Object { [int]$_.DestPathLen -gt 380 } |
  Export-Csv .\evidence\discovery\long-paths.csv -NoTypeInformation
```

Linux / NAS (bash, read-only):

```bash
find /volume1/shares -type f -printf '%s\t%TY-%Tm-%Td\t%p\n' > files.tsv
awk -F'\t' 'length($3) > 330' files.tsv > long-paths.tsv      # leave headroom for the destination prefix
find /volume1/shares -name '*[":<>?*|]*' > invalid-names.txt
```

## Design decisions (phase 2) - record each in DECISIONS.md
- Site architecture: one site per department/function vs one site with many libraries. Permissions follow sites; keep them simple.
- Teams-connected site or plain SharePoint site for each area
- Access method for users: OneDrive sync, "Add shortcut to My files", or browser only. Big libraries should not be synced in full.
- Permission model: Microsoft 365 groups or security groups per site; no per-user grants
- What not to migrate: stale archive, duplicates, app data files that cannot live in SharePoint (QuickBooks, Access back ends) - these need their own plan
- Tool: Migration Manager (multiple shares, agents) or SPMT (small, one-off)
- Cutover approach: initial copy, then incremental passes, then a read-only cutover window

## Build & Pilot (phase 3)
- [ ] Create sites, libraries, and permission groups (B)
- [ ] Fix long paths and invalid names with the share owners (C - renames are user-visible)
- [ ] Install Migration Manager agent / SPMT on a machine close to the source (A to stage, B to run against a test library)
- [ ] Pilot: migrate one small share, have 3-5 users work from it for a few days
- [ ] Write end-user KB: how to open files now, how to sync or add a shortcut (`kb-article-writing`)
- [ ] Write cutover runbook from `templates/runbook-cutover.md`

## Rollout (phase 4)
- Per wave: initial copy days ahead, incremental the night before, cutover window: set source read-only -> final incremental -> repoint drive maps/shortcuts -> verify -> comms
- Keep the source **read-only, not deleted**, for the agreed retention period. Deleting the source data or the old server afterwards is approval level D: one `DEL-<nnn>` request per server or share, once validation and the waiting period are done (`destructive-change-approval`)

## Validation
- Migration Manager / SPMT reports: 0 failed items, or every failure explained
- File counts and total size per share vs destination
- A real user from each group opens, edits, and saves a file

## Gotchas
- Excel and CAD links break when paths change; find them in discovery, fix in hypercare
- Scanners that save to a share need a new destination (often a OneDrive folder or a different workflow)
- Users who sync huge libraries hit performance problems; steer them to shortcuts and Files On-Demand
- Migration doesn't apply library content types; files arrive as "Document"
