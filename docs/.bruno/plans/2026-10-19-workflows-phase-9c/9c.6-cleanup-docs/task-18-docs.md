### Task 18: Decisions D178-D182, spec, roadmap and guides

R335 (docs), R316-R341, D178-D182 (`../00-shared.md` "Decisions", the source text), Q60-Q68 of `../00-answers.md`, the Global Constraint "SEC ids appear only in plan files" (8a); spec 4.4, 8, 13.1, 13.2, 13.6 and 13.7 as built; roadmap row 9c. Model: `../../2026-10-18-workflows-phase-9b/9b.8-docs/task-25-docs.md`. A docs task: no TDD cycle and no code. **Every sentence below is a claim about code Tasks 1-17 built. Step 1 re-reads that code before any text is written, and a claim the code contradicts is corrected in the doc (in the script of the step that writes it), never kept and never fixed in code.** The 9c task files were written in parallel, so a contract name that a task renamed is fixed here and listed in the commit body and under "Contract notes" of the executor's report.

- **Decisions** (`docs/.bruno/workflows/decisions.md`, last entry today D177): append D178 (one Reviewer exclusions page under Settings), D179 (end of the picked local day is 23:59:59.999), D180 (exclusion users), D181 (the exclusion list shows everything) and D182 (the role form grants workflows access), each in the neighbours' format (`## D178. Title`, body, `**Refines** ...`, `Covers R.... Decided 2026-10-19 (phase 9c plan, user answer(s) Q...).`). Add a "Built in phase 9c" or "Refined by" note to every decision the new ones refine or build: D16, D43, D54, D73, D78, D105, D106, D110, D124 and D162.
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): status line and range D1-D182; 4.4 (23:59:59.999, `includeExpired`, the client reason cap, no user check); 8 (the "Security UI" sentence); 13.1 (the configuration bullet at line 510: settings have their own `WorkflowSettingsGateway` / `WorkflowSettingsUseCases`; the gate bullet at line 512: menu items and configuration queries gated, the editor and settings routes registered with the flag and showing a no-access view); 13.2 (the intro gate sentence and the line 537 sentence about 9c); 13.6 and 13.7 rewritten as built.
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D182, row 9c **Built** (plan `docs/.bruno/plans/2026-10-19-workflows-phase-9c/`, six sub-phases).
- **Guides** (`docs/.bruno/workflows/`): `app.md` (intro and path roots, section 1 layout, registration, barrel, routes and the permission element, section 3 mounting gate and known limits, a new section 3a for the settings page, section 5 settings operations, section 8 dead code gone, section 9 nothing open for 9c), `api.md` (header sentence, the stale `src/types.ts` line 21, new section 14), `integrations.md` (the three sentences that say the editor route shows only with `editor`), `README.md` (the phase list and the package table). `automations.md`, `routing.md`, `ai-tools.md`, `notifications.md`, `bugs.md`, `open-questions.md` and `infrastructure.md` have no statement 9c changes (Step 2 proves it).
- **No SEC id** in any committed file. The design boards are marked implemented by the controller with `/design-pull mark` after this task; that is not a step here (R335).

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `docs/.bruno/workflows/api.md`, `docs/.bruno/workflows/integrations.md`, `docs/.bruno/workflows/README.md`

**Interfaces:**
- Consumes: the whole phase as committed (Tasks 1-17), the `## Decisions` and `## Rulings` of `../00-shared.md` (D178-D182, R316-R341, A107-A112, the Copy gaps list), Q60-Q68 of `../00-answers.md`, the execution rulings of `.superpowers/sdd/p9c-plan/exec-ledger.md`, and the existing docs as quoted in the scripts below (every `old` text is asserted unique by the helper that uses it; all anchors were checked against the docs at BASE 576c24d1a8 by running every script on a copy).
- Produces: the recorded decisions D178-D182 and the as-built documentation, no code. Acceptance: Step 7 prints what it says; no SEC id; `yarn format:check` clean for the touched files.

**How to apply an edit:** every edit is a short Python script that asserts each `old` text occurs exactly once (`rep`, `rep_line`, `add_to_line`, `note`; repeated in each script because each runs on its own). A failed assertion means the document changed since this plan was written: open the file, find the current text of that sentence, change the `old` string in the script (never the intent) and record the change in the commit body. Run the scripts from the repository root with `python3 -I -`. When Step 1 or Step 1b shows the code differs from a sentence, edit the sentence inside the script before running it.

- [ ] **Step 1: Re-read the built code (every claim is checked here first)**

Run each block from the repository root and read the output; do not skim. The names in the scripts below are the contract's (`../00-shared.md` "Interfaces by task"); this step is where a rename by an executor is found. Keep a scratch list (in the scratchpad directory, not in the repo) of every name or text that differs, and apply it to the scripts of Steps 3-6 before running them.

```bash
# Files and names (Tasks 2-13, 15-17)
git log --oneline 576c24d1a8..HEAD | cat
find packages/app-workflows/src/settings -type f -not -name '*.test.*' | sort
ls packages/app-workflows/src/domain/permissions packages/app-workflows/src/presentation/permissions
cat packages/app-workflows/src/index.tsx
grep -n "RegisterFeature\|ExclusionsSettings\|SecurityPermissions\|WorkflowEditorConfig" packages/app-workflows/src/app.tsx
ls packages/app-workflows/src/features packages/app-workflows/src/domain/permissionsSchema.ts packages/app-workflows/src/presentation/permissions/HasWorkflowsEditorPermission.tsx 2>&1 | cut -c1-120

# Services (Tasks 2-3)
grep -rn "createAbstraction\|createFeature\|name:" packages/app-workflows/src/settings --include='*.ts' | grep -v "\.test\." | cut -c1-160
grep -rn "includeExpired" packages/app-workflows/src/settings --include='*.ts' | grep -v "\.test\."
grep -rn "query GetWorkflowSettings\|mutation UpdateWorkflowSettings\|SETTINGS_FIELDS =" packages/app-workflows/src/settings
grep -rn "listUsers" packages/app-workflows/src/settings --include='*.ts' | grep -v "\.test\." | cut -c1-160

# Model (Tasks 4-5)
ls packages/app-workflows/src/settings/model/time packages/app-workflows/src/settings/model/list
grep -rn "23, 59, 59, 999\|59:59.999\|999" packages/app-workflows/src/settings/model/time --include='*.ts' | grep -v "\.test\." | head -5
grep -rn "REASON_MAX_LENGTH" packages/app-workflows/src/settings/model/constants.ts

# Presenters, views, mounting (Tasks 7-13)
ls packages/app-workflows/src/settings/presentation packages/app-workflows/src/settings/presentation/*/
grep -rn "transient\|singleton\|inSingletonScope\|inTransientScope" packages/app-workflows/src/settings --include='feature.ts'
cat packages/app-workflows/src/settings/routes.ts
grep -n "name=\|text=\|parent=\|pinnable\|editor" packages/app-workflows/src/settings/mounting/ExclusionsSettings.tsx
grep -n "EditorNoPermission\|editor" packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx

# Picker note (Task 6), admin-ui fix (Task 1)
grep -n "note" packages/app-workflows/src/components/picker/PickerOption.ts packages/app-workflows/src/components/picker/renderPickerOption.tsx | head -6
grep -n "parseDateOnlyValue\|minDate\|maxDate" packages/admin-ui/src/DatePicker/primitives/DateOnlyPicker.tsx packages/admin-ui/src/DatePicker/utils/dateHelpers.ts | head -8

# Role form (Tasks 15-16)
grep -n "name=\|title=\|description=\|icon=\|element=\|schema=" packages/app-workflows/src/presentation/permissions/SecurityPermissions.tsx
grep -rn "usePermissionValue\|aacl\|onChange" packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.tsx | head -6
grep -rn "export const\|export function" packages/app-workflows/src/domain/permissions --include='*.ts' | grep -v "\.test\."

# No API change (Q65)
git diff --stat 576c24d1a8..HEAD -- 'packages/api-*' | tail -3
```

Expected: the files and names of the contract's Tasks 1-17 (a `features` folder, `permissionsSchema.ts` and `HasWorkflowsEditorPermission.tsx` report "No such file or directory"); `index.tsx` exports only `WorkflowsAdminApp` and `useWorkflowsPermission`; `includeExpired: true` in the settings use case; the route `Workflows/Settings/Exclusions` at `/settings/workflows/exclusions`; the menu group `settings.workflows` with text `Workflows` and the item `Reviewer exclusions`, both behind `editor`; `WorkflowEditorRoute` renders `EditorNoPermission` without `editor`; `PickerOption.note`; `DateOnlyPicker` passes `minDate` and `maxDate`; `SecurityPermissions` passes `element` and no `schema`, the description `Publishing workflows for Headless CMS and Website Builder`; the last command prints nothing (no `packages/api-*` change). Every name of the scripts below that differs is replaced by the as-built name.

Then read every design text the docs quote, each with its own command, and change the doc sentence where the code differs (in particular where a Copy gap fallback of `../00-shared.md` was replaced by the controller):

```bash
for s in "You don't have access to reviewer exclusions" "Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role." "Could not load exclusions" "Could not load user names." "Deleted user" "This user no longer exists" "No reason given" "Until removed" "End of " "In the list" "Pick today or a later date." "The server did not respond, so nothing was changed. Try again." "Could not save: " "Exclusion added" "Exclusion updated" "Exclusion removed" "Remove exclusion?" "can be assigned automatically again. Nothing changes for work they already hold." "This user no longer exists, so removing the entry changes nothing else." "Filter by user" "All users" "Reviewer exclusions" "Manage workflows" "Reassign and operate" "Publishing workflows for Headless CMS and Website Builder" "Reviewing is not a permission." "You don't have access to workflows"; do printf '%s => ' "$s"; grep -rlF "$s" packages/app-workflows/src --include='*.ts' --include='*.tsx' | grep -v "\.test\." | head -2 | tr '\n' ' '; echo; done
```

Expected: every string prints at least one non-test source file. A string that prints nothing was changed during execution (a Copy gap confirmed differently, a ruling): find the as-built text and use it in the scripts.

- [ ] **Step 1b: Read the execution rulings**

```bash
grep -n "^Ruling\|^Task [0-9a-z]*: implemented\|DONE_WITH_CONCERNS\|^PRE-MERGE\|^Final\|Copy gap" .superpowers/sdd/p9c-plan/exec-ledger.md | cut -c1-400
```

If `.superpowers/sdd/p9c-plan/exec-ledger.md` does not exist, stop and report: the docs are not written without the ledger. If it exists but has no "Ruling" lines, there is nothing to record from rulings: write `Execution rulings recorded: none` in Step 8 and still read the `DONE_WITH_CONCERNS`, Copy gap and final-review lines below. Otherwise read every "Ruling:" line, every `DONE_WITH_CONCERNS` entry, every Copy gap confirmation and every final-review "FIX" / "LEAVE" line (and, where a ruling names a task report, `.superpowers/sdd/p9c-plan/exec-task-NN-report.md`). For each, decide and note in the scratch list:

1. **Changes what the code does, says or is called** (a copy string, a name, a behaviour, a deviation from the design, a Copy gap fallback replaced): the docs must say it. Put it in the matching text: a decision body or note (Step 3), the spec bullet (Step 4), the roadmap row (Step 5), `app.md` (Step 6a, the section 3a "Deviations from the design" bullet for deviations) or `api.md` section 14 (Step 6b). A ruling that contradicts a sentence of this task changes that sentence.
2. **A deviation that stays and a reader would trip over**: add it to the section 3a "Deviations from the design" bullet of Step 6a.
3. **Internal only** (test fixtures, a refactor with no visible effect, a parked minor): leave it out of the docs.

Every ruling of the first two kinds is listed in the commit body of Step 8 after `Execution rulings recorded:` and in the report under "Execution rulings". If a ruling reverses a rule that D178-D182 or a note states, correct the decision text (it records what was built, with the ruling as its source).

- [ ] **Step 2: Baseline greps**

```bash
grep -rnE "Open for 9c|: 9c\.|WorkflowsPermissionsFeature|permissionsSchema|HasWorkflowsEditorPermission|no right-hand note|not read by the 9a editor|gets a \"custom\" access level|each shown only when|both render nothing|show only with the workflows .editor. permission and the feature flag|Route, menu and config queries show only|IWorkflowsSecurityPermission \{ editor: boolean" docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-120
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D177" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-60
grep -c "^## D17[89]\.\|^## D18[0-2]\." docs/.bruno/workflows/decisions.md
grep -rnE "xclusion|9c|editor\` permission" docs/.bruno/workflows/automations.md docs/.bruno/workflows/routing.md docs/.bruno/workflows/ai-tools.md docs/.bruno/workflows/notifications.md docs/.bruno/workflows/bugs.md docs/.bruno/workflows/open-questions.md docs/.bruno/workflows/infrastructure.md | cut -c1-110
```

Expected at plan time: the first grep hits `app.md` (the layout line naming `domain/permissionsSchema.ts`, the barrel line naming `WorkflowsPermissionsFeature`, the routes line `each shown only when` and `permissionsSchema.ts`, the editor mounting line `both render nothing`, the known limits `no right-hand note`, section 9 `Open for 9c`), `api.md` (line 21), `integrations.md` (the CMS editor bullet, the editor-wide bullet) and the spec (13.1 `not read by the 9a editor`, 8 `gets a "custom" access level`, 13.2 `: 9c.`); the second prints nothing; the third shows the spec status line and the roadmap header; the fourth prints `0`; the fifth prints only `routing.md` lines (the product brief's exclusion behaviour, unchanged by 9c), `infrastructure.md:117` (the 2026-10-01 storage note) and `open-questions.md:83` (an earlier phase's spec note). Read every hit of the fifth grep: a sentence that states something 9c changed (the settings page, the permission UI, the editor route gate) is fixed in a script below and listed in the commit body; anything else stays.

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

The script inserts the notes at the end of the named decisions (before the next `## D` heading) and appends D178-D182 at the end of the file. Run it once; it asserts every anchor.

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/decisions.md")
t = p.read_text()

def note(t, n, text):
    h = "\n## D%d. " % n
    assert t.count(h) == 1, n
    i = t.index(h) + 1
    j = t.find("\n## D", i)
    assert j != -1, n
    return t[:j].rstrip("\n") + "\n\n" + text + "\n" + t[j:]

t = note(t, 16, """_Built in phase 9c (D178): Settings > Workflows > Reviewer exclusions edits the list for every app. The page reads with `getSettings(includeExpired: true)`, so expired entries are shown and kept, and every save sends the whole list._""")

t = note(t, 43, """_Refined by D179 (phase 9c): the end of the picked day is 23:59:59.999 in the browser's timezone (UTC when it cannot be resolved), the earliest pickable day is today, and the admin reads and edits the list on the Reviewer exclusions page with `editor`._""")

t = note(t, 54, """_Built in phase 9c (D182): the role form's Workflows group has No access, Full access (stored `{ name: "workflows.*" }`) and Custom (stored `{ name: "workflows", editor?: true, reassign?: true }`) with the checkboxes "Manage workflows" (`editor`) and "Reassign and operate" (`reassign`); Custom needs no `aacl` licence._""")

t = note(t, 73, """_Built in phase 9c (D179): the conversion is the pure function `getEndOfLocalDay(date, timeZone)` in the settings model (`[AW]/settings/model/time/`), called by the Add / Edit dialog presenter, not a presenter helper._""")

t = note(t, 78, """_Built in phase 9c (D178): the admin hides the Settings menu group and item without `editor`; the settings route and the editor routes are registered whenever the feature flag is on and show a no-access view without it. A `Workflows/NotAuthorized` answer to `getSettings` or `listUsers` shows the same view. The server checks are unchanged._""")

t = note(t, 105, """_Refined by D180 (phase 9c): the Add picker lists users already in the list as disabled with "In the list", so the admin builds no client duplicate error and no link to the entry. A duplicate that reaches the server (another admin's add) shows "Could not save: This user is already in the list. Edit it instead." in the dialog._""")

t = note(t, 106, """_Built in phase 9c (D178): Add, Edit and Remove each save at once from their dialog, sending the list from the last load or the last successful save with exactly one change; the record the server returns becomes the list._""")

t = note(t, 110, """_Refined by D179 (phase 9c): the hover reads "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)" (weekday, date, time, the short zone name and the IANA zone); without a resolvable timezone the zone is UTC._""")

t = note(t, 124, """_Built in phase 9c (D179): "End of {d Mon yyyy}" when the instant is 23:59 local, else "{d Mon yyyy}, {HH:mm}", with fixed English month names; "Until removed" for no date. "Pick today or a later date." shows only when the date was changed._""")

t = note(t, 162, """_Refined by D178 and D182 (phase 9c): the editor routes are registered whenever the feature flag is on and show the no-access view without `editor` (the menu items and configuration queries stay gated), and the role form can grant `reassign`._""")

NEW = """

## D178. One Reviewer exclusions page under Settings

Settings > Workflows > Reviewer exclusions at `/settings/workflows/exclusions` is one page for every app, mounted once by `WorkflowsAdminApp`. The Settings menu group "Workflows" and its item "Reviewer exclusions" show only with `editor`; the route is registered whenever the `advancedPublishingWorkflow` flag is on and, without `editor` (or when the server answers `Workflows/NotAuthorized`), shows "You don't have access to reviewer exclusions" instead of a not-found page. The editor routes get the same change: registered whenever the flag is on, they show "You don't have access to workflows" without `editor`, and their menu items stay hidden. The page reads with `getSettings(includeExpired: true)` and has its own settings gateway and use cases. Add, Edit and Remove each save at once from their dialog, sending the whole list from the last load or the last successful save with exactly one change; the returned record becomes the list; the last save wins and there is no conflict UI (D106 unchanged). The Add button shows only once a list has loaded, so a save never starts from an empty list. No API changes.

**Refines** D16, D78 and D162.

Covers R316, R317, R318, R329, R330, R331. Decided 2026-10-19 (phase 9c plan, user answers Q61, Q62, Q65).

## D179. End of the picked local day is 23:59:59.999

`endsOn` is 23:59:59.999 on the picked day in the browser's timezone, stored as a UTC instant; the timezone is `Intl.DateTimeFormat().resolvedOptions().timeZone`, or UTC when that is empty or fails. An entry is active while `endsOn` is later than now (the server's rule). The earliest pickable day is today in that timezone (the admin-ui `DateOnlyPicker` now honours `minDate` and reads `yyyy-MM-dd` as a local date). Editing without changing the date keeps the stored instant; a cleared date stores none. The Until cell shows "Until removed", "End of {d Mon yyyy}" when the instant is 23:59 local, or "{d Mon yyyy}, {HH:mm}"; the hover shows `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`, with UTC when the timezone cannot be resolved.

**Refines** D43, D73, D110 and D124.

Covers R319, R320, R336, R337, R339. Decided 2026-10-19 (phase 9c plan, user answer Q63).

## D180. Exclusion users

Names come from `listUsers({ ids })` in chunks of 200. A missing id is "Deleted user" ("This user no longer exists"); its entry can still be edited and removed. A failed lookup shows the user id on the row and the banner "Could not load user names." with Try again, which asks only for the unresolved ids. The Add picker searches `listUsers` and lists users already in the list as disabled with the right-hand note "In the list" (the shared `WorkflowPicker` gained an optional note), so there is no client duplicate error. The server does not check that a user exists. The reason is trimmed on the client, whitespace only counts as empty, and it is capped at 500 characters. No avatars and no team sub-lines.

**Refines** D105.

Covers R321, R324, R325, R328, R332. Decided 2026-10-19 (phase 9c plan, user answers Q64, Q65, Q68).

## D181. The exclusion list shows everything

No paging. Tabs Active, Expired and All, Active by default and selected again after an add (an edit or a remove keeps the tab). A "Filter by user" picker lists only the users in the list, filtered on the client. Rows are sorted by the user's name, then the user id (not by end date).

Covers R322, R323. Decided 2026-10-19 (phase 9c plan, user answer Q66).

## D182. The role form grants workflows access

The role form (and the API key form) has a custom Workflows group with No access, Full access and Custom. Full access stores `{ name: "workflows.*" }`; Custom stores one `{ name: "workflows", editor?: true, reassign?: true }` with the checkboxes "Manage workflows" (`editor`) and "Reassign and operate" (`reassign`), and is kept as Custom with nothing ticked. An existing `{ name: "workflows.*", editor: true }` loads as Full and is rewritten only when the admin changes the group; a `*` entry shows Full and locked; an unrecognised `workflows` entry is read by its flags; every other permission entry is kept untouched. The group writes only on a user action, so opening a role does not change it. Custom needs no `aacl` licence (workflows has its own). The unused `HasWorkflowsEditorPermission`, the never-resolved `WorkflowsPermissions` DI feature and the permission schema were deleted.

**Refines** D54 and D162.

Covers R333, R334, R341. Decided 2026-10-19 (phase 9c plan, user answers Q60, Q67, Q68).
"""
t = t.rstrip("\n") + NEW
p.write_text(t)
PY
```

- [ ] **Step 4: Spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`)**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/specs/2026-10-05-workflows-refactor-design.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

def rep_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = new
    t = "\n".join(lines)

# status line and range
rep("updated 2026-10-18 (phase 9b:", "updated 2026-10-19 (phase 9c: D178 one Reviewer exclusions page under Settings; D179 end of the picked local day is 23:59:59.999; D180 exclusion users; D181 the exclusion list shows everything; D182 the role form grants workflows access), earlier updated 2026-10-18 (phase 9b:")
rep("Consolidates decisions D1-D177", "Consolidates decisions D1-D182")

# 4.4
rep("- `endsOn` is end of the picked day in the saving admin's browser timezone; active or expired is computed from the instant. Editing without changing the date keeps the stored instant [D110, D124].",
"""- `endsOn` is 23:59:59.999 on the picked day in the saving admin's browser timezone (UTC when the timezone cannot be resolved), stored as a UTC instant; an entry is active while `endsOn` is later than now, the same for every viewer; the earliest pickable day is today. Editing without changing the date keeps the stored instant [D110, D124, D179].
- `getSettings` returns only active entries unless `includeExpired` is true; the settings page always asks for them, because a save replaces the whole record and an entry it did not load would be deleted [D178].
- The admin trims the reason, saves whitespace only as no reason and caps it at 500 characters; the server trims it, has no cap and does not check that the user exists [D180].""")

# 8
rep("- Security UI gets a \"custom\" access level with these checkboxes.", "- Security UI: the role form's Workflows group has No access, Full access (stored `{ name: \"workflows.*\" }`) and Custom (stored `{ name: \"workflows\", editor?: true, reassign?: true }`, kept as Custom with nothing ticked) with the checkboxes \"Manage workflows\" (`editor`) and \"Reassign and operate\" (`reassign`); an existing `{ name: \"workflows.*\", editor: true }` loads as Full; Custom needs no `aacl` licence (13.7) [D54, D182].")

# 13.1
rep("have one gateway and one use-case token; settings and users are not read by the 9a editor [D132, D133, D166].", "have one gateway and one use-case token, which also serves `listUsers` (9b); the settings page (13.6) has its own `WorkflowSettingsGateway` and `WorkflowSettingsUseCases` over `getSettings` and `updateSettings` and reuses that `listUsers` [D132, D133, D166, D178].")
rep("The workflow editor's route, menu item and configuration queries are one more such gate: they show only to viewers with `editor`.", "The menu items of the workflow editor and of the settings page, and the editor's configuration queries, are one more such gate: they show only to viewers with `editor`. The editor routes and the settings route are registered whenever the feature flag is on and show a no-access view without `editor` instead of a not-found page [D178].")

# 13.2
rep("the route, the menu item and every configuration query show only to viewers with the workflows `editor` permission (a display gate, the server keeps its checks) [D162].", "the menu item and every configuration query show only to viewers with the workflows `editor` permission, and without it the route shows \"You don't have access to workflows\" and mounts no editor (a display gate, the server keeps its checks) [D162, D178].")
rep("The exclusion settings page and the permission UI: 9c.", "The exclusion settings page and the permission UI were built in 9c (13.6, 13.7).")

# 13.6
SETTINGS = """- Settings > Workflows > Reviewer exclusions at `/settings/workflows/exclusions`, one page for every app, mounted once by `WorkflowsAdminApp`. The menu group "Workflows" and the pinnable item "Reviewer exclusions" show only with `editor`; the route is registered whenever the feature flag is on and, without `editor` or when the server answers `Workflows/NotAuthorized`, shows "You don't have access to reviewer exclusions" with "Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role." [D178].
- Loading: `getSettings(includeExpired: true)`, five skeleton rows while it runs, and "Could not load exclusions" with Try again when it fails. User names come from `listUsers({ ids })` in chunks of 200; a missing id is "Deleted user" ("This user no longer exists"); a failed lookup shows the user id and the banner "Could not load user names." with Try again, which asks only for the unresolved ids [D117, D180].
- The list shows every entry without paging: tabs Active, Expired and All (Active by default and after an add), a "Filter by user" picker over the users in the list, sorted by name and then user id. Columns User, Reason ("No reason given" when empty), Until and Status (`Active` or `Expired`, an expired row dimmed). Until reads "Until removed", "End of {d Mon yyyy}" for an instant at 23:59 local, or "{d Mon yyyy}, {HH:mm}", and its hover reads "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)". A rules card above the list says what an exclusion does [D110, D124, D179, D181].
- Add, Edit and Remove each save at once from their dialog, sending the list from the last load or the last successful save with exactly one change; the returned record becomes the list; the last save wins, with no conflict UI [D106]. Success toasts ("Exclusion added", "Exclusion updated", "Exclusion removed") go through `Notifications` [D125]. A transport failure shows "The server did not respond, so nothing was changed. Try again." and a server error "Could not save: {server message}"; the dialog keeps the entered values.
- Add / Edit dialog: User (a searchable picker over `listUsers`; users already in the list are disabled with "In the list"; locked on Edit), Reason (optional, at most 500 characters, trimmed) and Until (a date from today on, with Clear; the end of that day in the viewer's timezone, 23:59:59.999, stored as UTC; an unchanged date keeps the stored instant; "Pick today or a later date." only for a changed date). Editing an expired entry or a deleted user's entry shows a note; a deleted user's entry can be saved or removed [D105, D179, D180].
- Remove dialog: "Remove exclusion?" with "{Name} can be assigned automatically again. Nothing changes for work they already hold." (a deleted user: "This user no longer exists, so removing the entry changes nothing else.")."""
rep_line("- Exclusion list page under the Settings menu, requiring `editor`.", SETTINGS)

# 13.7
SECURITY = """- The role form and the API key form have a Workflows group ("Publishing workflows for Headless CMS and Website Builder") with No access, Full access and Custom. Full stores `{ name: "workflows.*" }`; Custom stores one `{ name: "workflows", editor?: true, reassign?: true }` with the checkboxes "Manage workflows" (`editor`) and "Reassign and operate" (`reassign`) and is kept as Custom with nothing ticked. An existing `{ name: "workflows.*", editor: true }` loads as Full and is rewritten only when the admin changes the group; a `*` entry shows Full with the controls locked; an unrecognised `workflows` entry is read by its flags; every other permission entry is kept untouched, and opening a role changes nothing. Custom needs no `aacl` licence. The group shows only with the feature flag; without it a role's workflows entries are kept as they are [D54, D162, D182].
- The note under the group says that reviewing is not a permission: anyone in a step's reviewing teams who can read the content can review it."""
rep_line("- Workflows permission UI with full and custom access", SECURITY)
p.write_text(t)
PY
```

If Step 1 or Step 1b shows the code differs from a sentence (a copy text, the menu names, the tab behaviour, the role form shapes), change the sentence, not the code.

- [ ] **Step 5: Roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`)**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

def rep_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = new
    t = "\n".join(lines)

rep("D1-D177", "D1-D182")

ROW9C = "| 9c. Admin: settings, permissions | **Built** (plan `docs/.bruno/plans/2026-10-19-workflows-phase-9c/`, six sub-phases): Settings > Workflows > Reviewer exclusions (`/settings/workflows/exclusions`), one page for every app over the shared settings operations, with Active, Expired and All tabs, a user filter, every entry without paging (D181), names resolved by id with \"Deleted user\" (D180), and Add, Edit and Remove dialogs that each save the whole list from the last load (D106, D178); the end of the picked local day at 23:59:59.999 with the timezone on hover, an unchanged date keeping the stored instant (D179); users already in the list disabled in the Add picker with the new `WorkflowPicker` note (D180); the no-access view on the settings route and on the editor routes (D178); the role form's Workflows group with No access, Full access and Custom (`editor`, `reassign`), so `reassign` can be granted (D182); the admin-ui `DateOnlyPicker` honours `minDate` and reads `yyyy-MM-dd` as a local date; the unused permission component and DI feature deleted. No API change. The AI step editor moved to 9a (D167). Spec 4.4, 8, 13.1, 13.6 and 13.7 describe the result. **Not built:** exclusion history, notifications or audit (D65); conflict detection between admins (D106); avatars and team names on exclusion rows | 1b, 4, 6, 9a | 4.4, 8, 13.1, 13.2, 13.6, 13.7 |"
rep_line("| 9c. Admin: settings, permissions", ROW9C)
p.write_text(t)
PY
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
```

The awk line prints `6` six times (the table keeps its column count; the row text has no `|`).

- [ ] **Step 6: Guides (`docs/.bruno/workflows/`)**

**6a. `app.md`.**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/app.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

def add_to_line(prefix, extra):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = lines[hits[0]] + extra
    t = "\n".join(lines)

def rep_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = new
    t = "\n".join(lines)

# intro and path roots
rep("phases 8a, 8b, 9a and 9b (2026-10-16 to 2026-10-18, D157-D177); section 3 is the workflow editor of 9a and 9b.", "phases 8a, 8b, 9a, 9b and 9c (2026-10-16 to 2026-10-19, D157-D182); section 3 is the workflow editor of 9a and 9b, section 3a the Reviewer exclusions page of 9c.")
rep("- `[AWE]` = `[AW]/editor` (the 9a workflow editor; `[AW]/review/editor` is the 8a review session)", "- `[AWE]` = `[AW]/editor` (the 9a workflow editor; `[AW]/review/editor` is the 8a review session)\n- `[AWS]` = `[AW]/settings` (the 9c Reviewer exclusions page)")

# section 1: layout, registration, barrel, routes, permissions
rep_line("  - The permission code that stays:", "  - The settings area, `settings/` (section 3a), and the permission code: `domain/permissions/` (the role-form access model of 9c) and `presentation/permissions/` (`useWorkflowsPermission`, `SecurityPermissions`, `WorkflowsRolePermissions`). `domain/permissionsSchema.ts`, `features/permissions/` and `HasWorkflowsEditorPermission` were deleted in 9c (D182); the old editor's `hooks/canUseWorkflows.ts` went in 9a.")
rep("`WorkflowsAdminApp` registers the permissions, editor and shared review features and `SecurityPermissions`; it has no review route, menu or widget of its own.", "`WorkflowsAdminApp` registers the editor, settings and shared review features, `SecurityPermissions` and the settings route and menu (`ExclusionsSettings`); it has no review route, menu or widget of its own.")
rep("`WorkflowsAdminApp`, `useWorkflowsPermission` and `WorkflowsPermissionsFeature` (nothing else; the old editor's exports went with it in 9a). Phases 8a and 9a add nothing to this barrel:", "`WorkflowsAdminApp` and `useWorkflowsPermission` (nothing else; the old editor's exports went in 9a and `WorkflowsPermissionsFeature` in 9c). Phases 8a to 9c add nothing to this barrel:")
rep("- Routes: none in `[AW]`. The editor routes are per app (`/cms/workflows` in `[CMS]`, `/website-builder/workflows` in `[WB]`, each shown only when `useWorkflowsPermission().editor` is true),", "- Routes: one in `[AW]`, the settings route `ExclusionsRoute` (`/settings/workflows/exclusions`, `[AWS]/routes.ts`, D178). The editor routes are per app (`/cms/workflows` in `[CMS]`, `/website-builder/workflows` in `[WB]`; registered whenever the flag is on, they show the no-access view without `useWorkflowsPermission().editor`, and their menu items show only with it, D178),")
rep("Permissions: `createPermissionSchema({ prefix: \"workflows\", fullAccess: { editor: true } })` (`[AW]/domain/permissionsSchema.ts`), shown through `Security.Permissions`.", "Permissions: `Security.Permissions name=\"workflows\"` with the custom element `WorkflowsRolePermissions` and no schema (D182; next bullet).")
add_to_line("- Permissions in the admin (8b, D162):", " 9c (D182): the role form and the API key form render the Workflows group through `WorkflowsRolePermissions` (`[AW]/presentation/permissions/`), a controlled element over `usePermissionValue()` and the pure functions of `[AW]/domain/permissions/` (`readWorkflowsAccess`, `writeWorkflowsAccess`, `changeWorkflowsAccessLevel`, `getWorkflowsAccessNote`): No access, Full access (`{ name: \"workflows.*\" }`) and Custom (`{ name: \"workflows\", editor?: true, reassign?: true }`, the checkboxes \"Manage workflows\" and \"Reassign and operate\"). It owns only the `workflows` and `workflows.*` entries, calls `onChange` only on a user action (opening a role does not dirty the form), reads a legacy `{ name: \"workflows.*\", editor: true }` as Full and `*` as Full and locked, and has no `aacl` check. `SecurityPermissions` registers it with the icon `account_tree` and the description \"Publishing workflows for Headless CMS and Website Builder\".")

# section 3
rep("both render nothing without the `editor` permission (`useWorkflowsPermission().editor`, D162) and there is no `SecureRoute`.", "the menu link renders nothing without the `editor` permission (`useWorkflowsPermission().editor`, D162); the route is registered whenever the flag is on and, without `editor`, renders `EditorNoPermission` (\"You don't have access to workflows\") inside the layout instead of the view, so no editor query runs (D178). There is no `SecureRoute`.")
rep("picker rows have an icon column but no avatar and no right-hand note;", "picker rows have an icon column but no avatar (9c added the right-hand note, `PickerOption.note`);")

# section 3a
SETTINGS = """## 3a. Reviewer exclusions page (9c, as built)

One page for every app at `/settings/workflows/exclusions` (D178). `[AWS]` is `[AW]/settings`.

- Services: `WorkflowSettingsGateway` (`[AWS]/gateway/`: `getSettings(params)` and `updateSettings(data)` on the shared `workflows` root, returning the `{ data, error }` envelope) and `WorkflowSettingsUseCases` (`[AWS]/useCases/`: `getSettings()` always with `includeExpired: true`, because a save replaces the whole record; `updateSettings(settings)`; an envelope error throws `GraphQLOperationError`, a transport failure rethrows), both singletons of `WorkflowSettingsServicesFeature` (`[AWS]/feature.ts`). User names and the user search reuse `WorkflowConfigUseCases.listUsers`; there is no settings copy of it. The domain keeps `reason` and `endsOn` as `string | null`.
- Model: `[AWS]/model/time/` holds the date functions (D179): `resolveViewerTimeZone` (the only one that reads the environment; UTC fallback), `getTimeZoneOffset`, `getEndOfLocalDay`, `getLocalDate`, `getTodayLocalDate`, `toLocalMidnight`, `isPastDate`, `isExclusionActive`, `formatUntilLabel`, `formatUntilTitle` and `resolveEndsOn`; each takes the timezone and, where it needs the clock, `now` as arguments. `[AWS]/model/list/` holds `normaliseReason` (trim, empty to `null`, 500 characters), `upsertExclusion`, `removeExclusion`, `filterExclusions`, `sortExclusions`, `getExclusionsEmptyState` and `searchFilterOptions`.
- Presenters (`[AWS]/presentation/`), all transient and registered in `[AW]/app.tsx`: `ExclusionsPagePresenter` (load, tabs, user filter, rows, empty and failure states, the no-access state for viewers without `editor` and for a `Workflows/NotAuthorized` answer, name resolution in chunks of 200 with a run token and Try again for the unresolved ids; it is the `ExclusionsSource` the dialogs read and adopts the record a save returns), `ExclusionDialogPresenter` (Add and Edit) and `RemoveExclusionDialogPresenter`. Each dialog sends the whole list from the last load with one change (D106) and toasts through `WorkflowEditorToasts` (D125). No dialog opens before a list has loaded.
- Views and mounting: `ExclusionsPage` and its parts under `exclusionsPage/components/`, the dialog views and their hosts, `ExclusionsRoute` (`[AWS]/routes.ts`) and `ExclusionsSettings` (`[AWS]/mounting/`: the route always, inside `AdminLayout` with the Settings breadcrumbs; the Settings menu group "Workflows" and the pinnable item "Reviewer exclusions" only with `editor`), mounted by `WorkflowsAdminApp`. The Until field is the admin-ui `DatePicker type="date"` with `minDate` (today), which `DateOnlyPicker` honours since 9c.
- Shared picker: `PickerOption` gained `note: string | null`, a right-aligned muted note (the full text in `title`); the Add picker lists users already in the list as disabled with "In the list" (D180). The user filter is a `WorkflowPicker` labelled "Filter by user" with the any row "All users".
- Tests: the settings fixtures and fakes are in `[AWS]/testing/` (R243). Every date test passes the timezone explicitly (Zagreb, New York, Tokyo, UTC and the DST change days), independent of the machine's zone.
- Deviations from the design: no "Load more" and no end-date sort (D181), no avatars or team sub-lines (D180), no client duplicate error and no "Edit their entry" button (users already in the list cannot be picked), the toasts are the shared stack, not the centre pill (D125), and the Add button is hidden while the list loads and after a failed load.

"""
head = "## 4. Content review flows (as built)\n"
assert t.count(head) == 1
i = t.index(head)
t = t[:i] + SETTINGS + t[i:]

# section 5
head = "## 6. Consumer contract\n"
assert t.count(head) == 1
i = t.index(head)
OPS = "- Settings operations (9c): `WorkflowSettingsGatewayImpl` (`[AWS]/gateway/`) sends `query GetWorkflowSettings($includeExpired: Boolean)` and `mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!)` on the shared `workflows` root, with `SETTINGS_FIELDS` (`[AWS]/gateway/settingsFields.ts`) and the shared `ERROR_FIELDS`; the names come from the configuration use cases' `listUsers`."
t = t[:i].rstrip("\n") + "\n" + OPS + "\n\n" + t[i:]

# section 8
rep_line("- Dead: DI `WorkflowsPermissions`", "- Dead code: none left of the permissions. `HasWorkflowsEditorPermission`, the DI `WorkflowsPermissions` feature (registered, never consumed) and `domain/permissionsSchema.ts` were deleted in 9c; `useWorkflowsPermission` over `getWorkflowsPermissionSet` is the one admin reader (D162, D182).")

# section 9 (the last section)
head = "## 9. Open for 9c\n"
assert t.count(head) == 1
i = t.index(head)
t = t[:i] + """## 9. Open after 9c

- Nothing is open for 9c. Not built: exclusion history, notifications or audit (D65), conflict detection between admins editing the exclusion list (D106), avatars and team names on exclusion rows and options (D180).
- Not built in the editor: read-access and exclusion warnings (Test routing reports them), an editor for the `modelId` rule condition (preserved only), `listStepCandidates` gateways and any change to the 8a `ReviewerPicker` (D175).
- Not planned: several workflows per model, secret settings. Next: the final sweep of anything left of the old domain (roadmap).
"""
p.write_text(t)
PY
```

If Step 1 shows a different name for a presenter, function, folder or route (`ExclusionsPagePresenter`, `ExclusionDialogPresenter`, `RemoveExclusionDialogPresenter`, `ExclusionsSource`, `ExclusionsSettings`, `ExclusionsRoute`, `WorkflowSettingsServicesFeature`, the `[AWS]/model/time/` and `[AWS]/model/list/` function names, `WorkflowsRolePermissions`, `readWorkflowsAccess`, `writeWorkflowsAccess`, `changeWorkflowsAccessLevel`, `getWorkflowsAccessNote`, `SETTINGS_FIELDS`), use the as-built name.

**6b. `api.md`** (a discovery snapshot of 2026-10-01; it is extended, and the one stale line 21 that the 9c permission work depends on is refreshed).

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/api.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

rep("sections 11 to 13 list what phases 8b, 9a and 9b added (decisions D160-D177 carry the rest).", "sections 11 to 14 list what phases 8b, 9a, 9b and 9c added or rely on (decisions D160-D182 carry the rest).")
rep("  - `src/types.ts`: `ICmsEntryWorkflowState`, `IWorkflowsSecurityPermission { editor: boolean }`; augments `IEntrySystem` with `workflow?: ICmsEntryWorkflowState | null` (`:20-24`).", "  - `src/types.ts`: `IWorkflowsSecurityPermission { editor?: boolean; reassign?: boolean }` (the stored `workflows` permission; a missing flag is not granted); augments `ICmsEntrySystem` with `workflow?: ReviewSystemWorkflow | null`. (Refreshed in 9c; the 2026-10-01 snapshot had `ICmsEntryWorkflowState` and `editor: boolean`.)")
t = t.rstrip("\n") + """

## 14. Phase 9c: settings and permissions (as built)

Phase 9c changed no API code (Q65); this section records what the admin settings page and the role form rely on.

- **Settings types.** `WorkflowSettings { exclusions: WorkflowExclusion[] }` and `WorkflowExclusion { userId; reason?; endsOn? }` (`src/domain/settings/types.ts`; `endsOn` an ISO datetime in UTC). GraphQL: `WorkflowsSettings { exclusions }`, `WorkflowsExclusion { userId, reason, endsOn: DateTime }`, the input `WorkflowsSettingsInput { exclusions: [WorkflowsExclusionInput!]! }` with `endsOn: String`, and the response `WorkflowsSettingsResponse { data, error }`.
- **Operations.** `workflows { getSettings(includeExpired: Boolean) }` returns only the active entries (`endsOn` missing or later than now, `filterActiveExclusions` in `src/domain/settings/`) unless `includeExpired` is true; the admin page always sends `true`, because `workflows { updateSettings(data) }` validates and replaces the whole record and returns it as saved, expired entries included (`SaveWorkflowSettingsUseCase` returns `repository.save(...)`). Both need `editor` (`GetWorkflowSettingsForEditorUseCase`, `SaveWorkflowSettingsForEditorUseCase` in `src/features/config/`): a refusal is `Workflows/NotAuthorized` ("You are not allowed to view the workflow settings." or "You are not allowed to change the workflow settings."), no identity is `Workflows/NotAuthenticated`. Last save wins, no version check (D106).
- **Validation** (`WorkflowSettingsValidator`, `src/domain/settings/`; code `Workflows/Settings/Validation`, `data: { userId }`): "Every exclusion needs a user.", "This user is already in the list. Edit it instead." (D105) and `The end date "{endsOn}" is not a valid date.`. It trims `userId` and `reason`, drops an empty reason, normalises `endsOn` with `toISOString()`, accepts a past `endsOn`, has no reason length cap and does not check that the user exists (the admin trims and caps the reason at 500 characters, D180). A storage failure is `Workflows/Settings/Persistence` with `data.cause`.
- **Permission shapes and the checker.** The stored `workflows` permission is `{ name: "workflows", editor?: true, reassign?: true }` or full access `{ name: "workflows.*" }`; the 9c role form writes exactly these (D182), and an older role's `{ name: "workflows.*", editor: true }` reads the same. `WorkflowsPermissions` (`src/features/permissions/WorkflowsPermissions/`) treats `workflows.*` and `*` as full access (`IdentityContext.getPermission` matches patterns) and otherwise grants `editor` or `reassign` when any `workflows` entry (one per role) has that flag `=== true`; it reads the identity's permissions on every call (`IdentityContext` caches them per identity).
"""
p.write_text(t)
PY
```

The section 14 facts are API code that 9c did not change (Q65); Step 1's last command proves no `packages/api-*` change. They were read at plan time from `packages/api-workflows/src/domain/settings/{types.ts, errors.ts, WorkflowSettingsValidator.ts, filterActiveExclusions.ts}`, `src/features/config/{GetWorkflowSettingsForEditor, SaveWorkflowSettingsForEditor}/`, `src/domain/permissions/errors.ts`, `src/features/permissions/WorkflowsPermissions/WorkflowsPermissions.ts`, `src/types.ts` and `src/graphql/WorkflowsSchemaFactory.ts:435-459, 553-572`.

**6c. `integrations.md`** (the editor route gate changed in 9c, R331).

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/integrations.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

rep("The menu item and the route show only with the workflows `editor` permission and the feature flag (D162).", "The menu item shows only with the workflows `editor` permission and the feature flag (D162); since 9c the route exists whenever the flag is on and shows the no-access view without `editor` (D178).")
rep("The menu item gained the `editor` gate it lacked (D162).", "The menu item gained the `editor` gate it lacked (D162); since 9c the route exists whenever the flag is on and shows the no-access view without `editor` (D178).")
rep("Route, menu and config queries show only with the `editor` permission.", "The menu item and the config queries show only with the `editor` permission; the route shows the no-access view without it (9c, D178).")
p.write_text(t)
PY
```

**6d. `README.md`.**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/README.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

rep("as built in phases 8a, 8b, 9a and 9b (shared review core", "as built in phases 8a, 8b, 9a, 9b and 9c (shared review core")
rep("the workflow editor as built in phases 9a and 9b.", "the workflow editor as built in phases 9a and 9b, the Reviewer exclusions page and the role-form permission element of 9c.")
rep("the workflow editor (phases 9a and 9b) | review core and editor tested |", "the workflow editor (phases 9a and 9b), the Reviewer exclusions page and the permission element (phase 9c) | review core, editor and settings tested |")
p.write_text(t)
PY
```

If an `old` text is not found because a sentence was reworded, find it (`grep -n "9b" docs/.bruno/workflows/README.md`) and change the `old` string, not the intent.

- [ ] **Step 7: Final greps (the proof)**

```bash
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -rnE "Open for 9c|: 9c\.|WorkflowsPermissionsFeature|permissionsSchema|HasWorkflowsEditorPermission|no right-hand note|not read by the 9a editor|gets a \"custom\" access level|each shown only when|both render nothing|show only with the workflows .editor. permission and the feature flag|Route, menu and config queries show only|IWorkflowsSecurityPermission \{ editor: boolean" docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-120
grep -rn "D1-D177\|D157-D177\|D160-D177" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md | cut -c1-90
grep -n "^## D17[89]\.\|^## D18[0-2]\." docs/.bruno/workflows/decisions.md
grep -c "(phase 9c)\|Built in phase 9c" docs/.bruno/workflows/decisions.md
grep -n "D1-D182" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-70
grep -n "^## " docs/.bruno/workflows/app.md
grep -n "^## 14\." docs/.bruno/workflows/api.md
grep -n "^### 13.6\|^### 13.7\|^### 13.8" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
git diff --stat | tail -10
yarn format:check 2>&1 | tail -5
```

Expected: the first grep prints nothing; the second prints exactly three `app.md` lines, each of which says the code was deleted in 9c (the layout line, the barrel line and the section 8 "Dead code" line); the third prints nothing; the fourth prints the five headings D178-D182; the fifth prints `10` (the ten notes: six "Built in phase 9c" and four "Refined by D17x/D18x (phase 9c)"); the sixth shows the spec status line and the roadmap header; the seventh lists the sections `1`, `2`, `3`, `3a. Reviewer exclusions page (9c, as built)`, `4` to `8` and `9. Open after 9c`; the eighth prints `## 14. Phase 9c: settings and permissions (as built)`; the ninth prints the three headings once each; the tenth prints `6` six times; `git diff --stat` lists only the seven docs files of this task; `yarn format:check` is clean for the touched files (run `yarn format:fix > /dev/null 2>&1` first if it reports wrapped lines in the markdown).

- [ ] **Step 8: Format, pre-commit chain and commit**

Docs only: no package source or `package.json` changes in this task, so `yarn adio`, `yarn check-ts-configs` and the builds have nothing to prove; they still run as part of the chain.

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
git add .
git checkout -- .gitleaks.toml
git status --short
```

`git status --short` must list only the docs files of this task (decisions, spec, roadmap, `app.md`, `api.md`, `integrations.md`, `README.md`) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then (one line per recorded execution ruling and per corrected name in the third `-m`, or `none`):

```bash
git commit -m "docs(workflows): record phase 9c (D178-D182), spec 4.4, 8, 13.1, 13.2, 13.6 and 13.7 and the guides as built" -m "Adds D178 (one Reviewer exclusions page under Settings), D179 (end of the picked local day is 23:59:59.999), D180 (exclusion users), D181 (the exclusion list shows everything) and D182 (the role form grants workflows access), adds notes to D16, D43, D54, D73, D78, D105, D106, D110, D124 and D162, updates spec 4.4, 8, 13.1, 13.2, 13.6 and 13.7, marks roadmap row 9c built, and updates app.md (new section 3a), api.md (new section 14 and the stale types line), integrations.md and README.md for the as-built phase 9c code." -m "Execution rulings recorded: <one line each, or none>. Names corrected against the code: <one line each, or none>." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. The contract's Task 18 entry and R335 list `decisions.md` (D178-D182), the spec (status line, 4.4, 8, 13.1, 13.2, 13.6, 13.7), the roadmap row 9c, `app.md` and `api.md`. This task also adds "Refined by" / "Built in phase 9c" notes to D16, D43, D54, D73, D78, D105, D106, D110, D124 and D162 (the decisions D178-D182 refine or build, as the 9b docs task did for its decisions), fixes the 13.2 intro sentence (it says the editor route shows only with `editor`, which R331 changed), adds a settings bullet to `app.md` section 5, edits `integrations.md` (three sentences say the editor route shows only with `editor`) and `README.md` (the phase list and package table name phases up to 9b). Without these the docs would contradict the code.
2. R335 says "sections 8 and 9" of `app.md`; section 9 is renamed "Open after 9c" because nothing is open for 9c any more, and the settings page gets its own section 3a (a new number would renumber sections other docs cite).
3. `api.md:21` is the stale `IWorkflowsSecurityPermission { editor: boolean }` line R335 names; it also named `ICmsEntryWorkflowState` and `IEntrySystem`, which `src/types.ts` no longer has (it augments `ICmsEntrySystem` with `ReviewSystemWorkflow`), so the whole line is refreshed with a "Refreshed in 9c" marker. Sections 1-10 stay a snapshot otherwise.
4. Decision sources: D178 also cites Q65 (no API changes) and covers R316 and R317; D180 covers R325 (dialog errors) and Q68; D182 covers R334 (cleanup, Q67) and R341 (the A109 check). The contract's Decisions entries give the core; the extra coverage records where each ruling lives.
5. Every name in the scripts (`WorkflowSettingsGateway`, `WorkflowSettingsUseCases`, `WorkflowSettingsServicesFeature`, `ExclusionsPagePresenter`, `ExclusionDialogPresenter`, `RemoveExclusionDialogPresenter`, `ExclusionsSource`, `ExclusionsRoute`, `ExclusionsSettings`, `ExclusionsPage`, the time and list functions, `WorkflowsRolePermissions`, the access functions, `PickerOption.note`, `SETTINGS_FIELDS`, `GetWorkflowSettings` / `UpdateWorkflowSettings`) is the contract's; the other 9c task files were written in parallel, so Step 1 checks each and a renamed one is corrected in the doc and listed in the report.
6. The Copy gap fallbacks the docs quote (`Filter by user` as the filter's label, `Try again` on the names banner) are the contract's; if the controller confirmed a different text during execution (Step 1b), the doc uses the confirmed text.
7. The design boards (`/design-pull mark`) are marked by the controller after this task (R335); there is no handoff file in this task.

## Review fixes (sub-phase review)

- Step 1b: a ledger without "Ruling" lines no longer stops the task (only a missing ledger does); the commit body then records `Execution rulings recorded: none`.
- Checked, no change: all seven Python scripts were run on copies of the seven docs at 576c24d1a8 (every anchor asserts once) and the Step 7 greps print what the task says (no SEC id, three `app.md` lines naming deleted code, D178-D182 headings, `10` notes, `D1-D182` twice, section `3a` and `9. Open after 9c`, `## 14.`, six `6`s); the `api.md` section 14 facts (validator messages, codes, `NotAuthorized` actions, GraphQL type names, `IWorkflowsSecurityPermission`, the checker) match `packages/api-workflows/src`; every name the docs use exists in the 9c.2-9c.5 task files.
