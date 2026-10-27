### Task 25: Decisions D170-D177, spec, roadmap and guides

R285-R315, D170-D177 (`../00-shared.md` "Decisions"), Q49-Q59 of `../00-answers.md`, the Global Constraint "SEC ids only in plan files", spec 4.1, 10 and 13.2 as built; roadmap rows 9a (known gap closed) and 9b (built). A docs task: no TDD cycle, no code. The proofs are greps before and after, a claim-by-claim check of every statement against the as-built code (Step 2), the recording of the execution rulings (Step 2b) and the pre-commit chain. **Every claim below is a claim about code Tasks 1-24 built: Step 2 checks each against the tree before the text is written, and a claim the code contradicts is corrected in the doc, never kept and never fixed in code.** The 9b task files were written in parallel, so a contract name that a task renamed is fixed here and recorded in the commit body and under "Contract notes" of the executor's report.

- **Decisions:** append D170 (`listUsers` can be scoped to teams), D171 (rule errors name the rule), D172 (the routing inspector answers for every rule), D173 (apps supply their folders), D174 (stale rule targets block Save), D175 (9b is editor-only), D176 (teams off disables People) and D177 (the stock admin-ui groups hold items by reference) to `docs/.bruno/workflows/decisions.md` (last entry today is D169). Notes on D46, D61, D66, D69, D95, D117, D118, D165 and D168 (each "Refined by" or "Built in 9b"). R310 names D170-D176; the contract's Decisions section also defines D177 (Q57), so eight decisions are recorded and the range is D1-D177.
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): status line and decision range; 4.1 (validation error data carries `ruleId`, rule messages); 10 (`listUsers` with `teamIds`, `listTeams` and teams off, `inspectRouting`, the validation error data); 13.2 (the assignment part becomes built: tabs, Assignment, Test routing, references, teams off).
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D177, row 9a (the "Not built" and "Known gap before merge" text), row 9b (built; no `listStepCandidates`; the 8a `ReviewerPicker` stays).
- **Guides** (`docs/.bruno/workflows/`): `app.md` (intro, section 3 bullets, section 9), `api.md` (header sentence, new section 13), `integrations.md` (the two editor bullets and section 5), `automations.md` (the `user` hint), `README.md` (index and package table). No other guide describes what 9b changes: `routing.md` is the product brief (kept), `bugs.md`, `open-questions.md`, `infrastructure.md`, `ai-tools.md` and `notifications.md` have no editor statement 9b changes (Step 1 greps prove it).
- **No SEC id** anywhere in the committed files. Plan files may keep them. There is no handoff file in this task (the user decides at the phase end).

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `api.md`, `integrations.md`, `automations.md`, `README.md`

**Interfaces:**
- Consumes: the whole phase (Tasks 1-24 as committed), the `## Decisions` and `## Rulings` of `../00-shared.md` (D170-D177, R285-R315, A101-A106, Q49-Q59 of `../00-answers.md`), the execution rulings of `.superpowers/sdd/p9b-plan/exec-ledger.md`, and existing docs as quoted in the steps below (every `old` text is asserted unique by the `rep` helper of the step that uses it).
- Produces: the recorded decisions D170-D177 and the as-built documentation, no code. Acceptance: Step 7 prints what it says; D170-D177 contain no SEC id; `yarn format:check` is clean for the touched files.

**How to apply an edit:** every edit is made by a short Python script that asserts each `old` text occurs exactly once (the `rep`, `rep_line` and `add_to_line` helpers below, repeated in each script because each script runs on its own). A failed assertion means the document changed since this plan was written: open the file, find the current text of that sentence, change the `old` string in the script (never the intent), and record the change in the commit body. Run the scripts from the repository root with `python3 -I -`.

- [ ] **Step 1: Baseline greps (the "failing test")**

```
grep -rnE "until 9b|in 9b\)|to 9b|for 9b|arrive with 9b|moves to 9b|carried unchanged|no tabs|ReviewerPicker|nown gap|DeprecatedRadioGroup|CheckboxPrimitiveRenderer|plain text until|still to build|Not in 9a" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-110
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D169" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-60
grep -c "^## D17[0-7]\." docs/.bruno/workflows/decisions.md
grep -rnE "listStepCandidates" docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-80
grep -rnE "config\.assignment\.rules|ruleId|teamIds|notEvaluated" docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/workflows/automations.md docs/.bruno/workflows/routing.md docs/.bruno/workflows/ai-tools.md docs/.bruno/workflows/notifications.md | cut -c1-110
```

Expected at plan time: the first grep hits `app.md` (Known limits, section 9 heading and its first bullet: `until 9b`, `ReviewerPicker`, `DeprecatedRadioGroup`, `CheckboxPrimitiveRenderer`), `automations.md` (`until 9b`, `plain text`), the spec (13.2: the People step line `carried unchanged`, the drawer line `no tabs in 9a`, the `Not in 9a, still to build` bullet and the 13.3 `ReviewerPicker` line, which stays), the roadmap row 9a (`Known gap before merge`) and decisions (`D168`, `D66` historical text, which keep their "Refined by" note); the second prints nothing; the third shows the spec status line and the roadmap header; the fourth prints `0`; the fifth shows row 9b (stale); the sixth prints at most the `api.md` section 12 line that mentions `config.assignment.rules` (extended, not corrected, by section 13) and nothing else (`routing.md`, `ai-tools.md` and `notifications.md` have no 9b statement: that is what keeps them untouched). Every hit outside the lists above is a stale statement to fix in the steps below or to explain in the commit body.

- [ ] **Step 2: Check every claim against the as-built code**

For each line run the command and fix the doc text in the later steps if the code differs (the contract names are the expectation; a rename found here is recorded in the commit body). The commands print file names and lines only; read them, do not skim.

```
# API (9b.2)
grep -n "TEAMS_FEATURE_FLAG\|INSPECTION_CANDIDATE_LIMIT" packages/api-workflows/src/constants.ts
ls packages/api-workflows/src/features/config/ListWorkflowUsers packages/api-workflows/__tests__/__helpers
grep -n "teamIds\|WorkflowsListedUser" packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
grep -n "WorkflowListedUser" packages/api-workflows/src/domain/config/types.ts
cat packages/api-workflows/src/domain/workflow/ruleErrorMessages.ts
grep -n "ruleId" packages/api-workflows/src/domain/workflow/errors.ts
grep -rn "ruleErrorMessages\|config.assignment.rules.target" packages/api-workflows/src --include=*.ts | grep -v test | head -8
grep -n "notEvaluated\|failedConditions\|narrowedTeamId\|candidateIds\|candidateCount\|WorkflowsRoutingCondition" packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
grep -rn "explain" packages/api-workflows/src/domain/routing packages/api-workflows/src/features/routing --include=*.ts | grep -v test | head -6
grep -rn "Teams are not enabled\." packages/api-workflows/src --include=*.ts | grep -v test | head -3
grep -n "isEnabled" packages/api-workflows/src/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts packages/api-workflows/src/features/config/ListWorkflowUsers/ListWorkflowUsersUseCase.ts packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts
grep -rn "The target team is not one of the step's reviewing teams\|The target user is not a member of the step's teams\|Choose who this rule assigns to" packages/api-workflows/src --include=*.ts | grep -v test | head -5
# Admin gateways, adapters, apps (9b.3)
grep -n "listUsers" packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts
grep -n "inspectRouting\|folderExists" packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts
grep -n "getFolderType\|listFolders\|AppFolder" packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts
ls packages/app-headless-cms-workflows/src/features/editorGateway/graphql packages/app-website-builder-workflows/src/features/editorGateway/graphql
grep -rn "ListFoldersGqlGateway" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --include=*.ts --include=*.tsx | grep -v test | head -4
grep -c "app-aco" packages/app-workflows/package.json packages/app-headless-cms-workflows/package.json packages/app-website-builder-workflows/package.json
grep -rn "app-aco" packages/app-workflows/src --include=*.ts --include=*.tsx | head -2
# Model and presenters (9b.4-9b.5)
ls packages/app-workflows/src/editor/model packages/app-workflows/src/editor/model/assignment packages/app-workflows/src/editor/model/rules packages/app-workflows/src/editor/model/testRouting
ls packages/app-workflows/src/editor/presentation/editor packages/app-workflows/src/editor/presentation/stepDrawer
grep -rn "ruleId" packages/app-workflows/src/editor/presentation/editor/mapSaveError.ts | head -3
grep -rn "1 routing rule\|routing rules\|requester can pick" packages/app-workflows/src/editor/model/getStepSummary.ts | head -4
grep -rn "Could not load the step options\." packages/app-workflows/src/editor | grep -v test | head -2
# Forms and renderers (9b.6-9b.7)
ls packages/app-workflows/src/editor/presentation/stepForm packages/app-workflows/src/editor/presentation/stepForm/renderers packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules packages/app-workflows/src/editor/presentation/stepForm/renderers/testRouting
grep -rn "FieldRenderer\|element:" packages/app-workflows/src/editor/WorkflowEditorConfig.tsx | head -20
grep -rn "permissions\|tabs(" packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.ts | head -6
grep -rn "RadioGroup\|CheckboxGroup" packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.tsx packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.tsx | head -4
grep -rln "DeprecatedRadioGroup\|CheckboxPrimitiveRenderer" packages/app-workflows/src | head -3
grep -rn "observable.ref\|observable(" packages/admin-ui/src/RadioGroup/primitives/presenters packages/admin-ui/src/CheckboxGroup/primitives/presenters packages/admin-ui/src/Checkbox/primitives/presenters | grep -v test | head -6
grep -rln "ReviewerPicker" packages/app-workflows/src | head -3
cat packages/app-workflows/src/index.tsx
```

In the same pass read, so the prose below is true: the string of every design text the docs quote or paraphrase, each with `grep -rn "<string>" packages/app-workflows/src/editor packages/api-workflows/src | grep -v test | head -2`: `Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab.`, `Let the requester pick a reviewer`, `None (team pool)`, `Round-robin`, `Least-loaded`, `The first matching rule wins. If no rule matches, the strategy decides.`, `Choose who this rule assigns to.`, `is no longer in the reviewing teams.`, `is not a reviewing team.`, `The assigned user was deleted.`, `The team was deleted.`, `The folder no longer exists.`, `Deleted user`, `Deleted team`, `Restricted folder`, `Deleted folder`, `This step has an error on the`, `Check this step`, `Choose a requester to test.`, `Testing…`, `Could not test routing: `, `the server did not respond.`, `An earlier rule matched.`, `All conditions match.`, `Rule moved to position`, `Teams are not enabled.`, `This step needs teams, which are not enabled. It can't be edited.`, `Fix the highlighted steps before saving.`. Also read: the outcome of the Task 18 spike (does `buildPeopleStepForm` use the `permissions` field type for `rules`, or the R293 fallback? the D66 note and the `app.md` Step forms bullet below say which), the name of the strategy renderer file and of every renderer registered in `WorkflowEditorConfig.tsx` (the lists below use the contract names `AssignmentStrategyRenderer`, `RoutingRulesRenderer`, `TestRoutingRenderer`, `UserPickerRenderer`, `FolderPickerRenderer`), the exact text the Test routing tab shows for an out-of-date result (the docs describe it without quoting), and the model helper names (`createRuleId`, `readAssignment`, `assignmentToConfig`, `getRuleIssues`, `describeRule`, `composeTestRoutingResult`, `getTestRoutingSignature`, `getStepErrorTab`). If a name or text differs, change the doc sentence, not the code, and list the change under "Contract notes" of the report.

- [ ] **Step 2b: Record the execution rulings**

```
grep -n "^Ruling\|^Task [0-9a-z]*: implemented\|DONE_WITH_CONCERNS\|^PRE-MERGE\|^Final" .superpowers/sdd/p9b-plan/exec-ledger.md | cut -c1-400
```

If `.superpowers/sdd/p9b-plan/exec-ledger.md` does not exist or has no "Ruling" lines, stop and report: the docs must not be written without the rulings. Otherwise read every "Ruling:" line, every `DONE_WITH_CONCERNS` entry and every final-review "FIX"/"LEAVE" line (and, where a ruling names a task report, `.superpowers/sdd/p9b-plan/exec-task-NN-report.md`). For each one decide, and write the decision in a scratch list in the scratchpad directory (not in the repo):

1. **Changes what the code does, says or is called** (a copy string, a name, a field, a behaviour, a deviation from the design, a fallback such as the R293 spike fallback, a deferred item left in code): the docs must say it. Put it in the matching text below: the decision note or the decision body (Step 3), the spec bullet (Step 4), the `app.md` bullet or Known limits (Step 6a), `api.md` section 13 (Step 6b). A ruling that contradicts a sentence of this task changes that sentence.
2. **A deviation that stays and a reader would trip over** (a known limit, a design string not used): add it to the `app.md` "Known limits" bullet of Step 6a.
3. **Internal only** (test fixtures, a refactor with no visible effect, a parked minor): leave out of the docs.

Every ruling of the first two kinds is listed in the commit body of Step 8 as `Execution rulings recorded: <one line each>`, and in the report under "Execution rulings". If a ruling reverses a contract rule that D170-D177 or a note states, correct the decision text (it records what was built, with the ruling as the source).

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

The script inserts the notes at the end of the named decisions (before the next `## D` heading) and appends D170-D177 at the end of the file. Run it once; it asserts every anchor.

```
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

t = note(t, 46, """_Refined by D171 (phase 9b): the stored rule shape is unchanged. The editor gives a rule an id when it is added (never on load, never on reorder), writes back every condition key and rule key it does not edit (`modelId`, a folder condition's own `type`, unknown keys) and a rule-level validation error names the field `config.assignment.rules.target` with the rule's `ruleId`; schema issues keep `config.assignment.rules.<index>.<path>`._""")

t = note(t, 61, """_Built in phase 9b (D174): a user target outside the step's teams, a team target outside them and a deleted user or team are rule errors on the client and the server and block Save. Whether a candidate can read the content, and exclusions (D118), are not shown in the editor; Test routing reports them through the server's skipped people (D175)._""")

t = note(t, 66, """_Built in phase 9b: the People form has the FormModel layout tabs General, Assignment and Test routing, `assignment` is a form object with `strategy`, `allowManualPick` and `rules`, and the reorderable rule list is edited by `RoutingRulesRenderer` over `rules`, a plain-JSON array field of the `permissions` field type. The `user` UI hint has its picker (see D168)._""")

t = note(t, 69, """_Built in phase 9b (D173): the folder control is the shared searchable `WorkflowPicker` over the folders each app's editor adapter lists (CMS: the ACO folders of `cms:<modelId>`; Website Builder: `wb:page`), the root excluded, shown as title paths. A saved folder that is not listed is "Restricted folder" when `folderExists` says it exists (preserved unchanged, the picker disabled, removable) and "Deleted folder" when it does not (a non-blocking warning)._""")

t = note(t, 95, """_Built in phase 9b (D172): the inspector is the Test routing tab of a People step. It runs `inspectRouting` on the unsaved step with a requester and an optional folder and shows the owner, the trace of every rule, the strategy line and the skipped people; the result is marked out of date when anything it depends on changes and is never re-run automatically._""")

t = note(t, 117, """_Built in phase 9b: the editor presenter resolves the saved user, team and folder ids of rules by id (users with `listUsers({ ids })` in chunks of 200, teams with `listTeams({ ids })`, folders from the adapter's list and then `folderExists`). The labels are "Deleted user", "Deleted team", "Restricted folder" and "Deleted folder"; a failed lookup shows the banner "Could not load the step options." with Try again instead of an empty value._""")

t = note(t, 118, """_Built in phase 9b: the editor does not show exclusions. Test routing shows a rule that was skipped because its target is excluded and lists the person among the skipped people with the server's reason (D172, D175)._""")

t = note(t, 165, """_Extended in phase 9b (D171): the data also carries `ruleId` (null when it does not apply) and rule-level failures name the field `config.assignment.rules.target`; the whole-list field `config.assignment.rules` is no longer emitted. The rule messages are rule-neutral ("The target user is not a member of the step's teams.", "The target team is not one of the step's reviewing teams."); the no-target message is unchanged._""")

t = note(t, 168, """_Built in phase 9b: People steps have the tabs General, Assignment and Test routing, the rule list is built, and the `user` hint renders a single-user picker over `listUsers` (D170); any other unknown hint still falls back as above._""")

NEW = """

## D170. `listUsers` can be scoped to teams

`workflows { listUsers(search, ids, limit, teamIds) }` takes an optional `teamIds` and returns each user's team ids: the result type is `WorkflowsListedUser { id, displayName, teamIds }` (`WorkflowsUser` stays for owners and candidates). A user matches `teamIds` when any of the user's teams is in the list (the `teams_in` filter the store check already uses); the filter combines with `search` and the limit rules are unchanged (default 50, at most 200, sorted by display name then id). An `ids` lookup ignores `search`, `limit` and `teamIds`, so a saved target that left the teams still resolves. The use case reads the team ids from the admin user it already lists and returns ids only, never team names. With the teams feature off (`advancedAccessControlLayer.teams`, read through the api-core `FeatureFlags` on every call) it queries no teams, `teamIds` is `[]` on every user and a request with `teamIds` returns no users. The editor uses it for the rule target members, the requester pickers, reference resolution and Test routing names.

Covers R286, R287. Decided 2026-10-18 (phase 9b plan, user answers Q49, Q58).

## D171. Rule errors name the rule

`WorkflowValidationErrorData` gains `ruleId` (null when it does not apply). A rule-level failure sets `stepId`, `ruleId` and the field `config.assignment.rules.target`: a rule without a target, a user target who is not a member of the step's teams (`The target user is not a member of the step's teams.`) and a team target outside the step's teams (`The target team is not one of the step's reviewing teams.`). The team-target check is rejected on save (`StoreWorkflowUseCase`), not only in the inspector. The messages live in one module, `ruleErrorMessages.ts`, used by `ReviewStepType`, `StoreWorkflowUseCase` and `InspectRoutingUseCase`, so the inspector's rule failures carry the same messages, field and `ruleId`. Schema failures keep `config.assignment.rules.<index>.<path>`. The editor marks the rule card and the field, and the step card shows `Rule {n}: {message}` with n from the rule's current position; an index in a schema path is converted to the rule id when the error is mapped, so a later reorder keeps the error on its rule.

**Refines** D165 and D46.

Covers R288, R303. Decided 2026-10-18 (phase 9b plan, user answers Q51, Q52).

## D172. The routing inspector answers for every rule

`inspectRouting` lists every rule in the trace: the outcome gains `notEvaluated` for the rules after the deciding one, a `notMatched` entry names its failed conditions (`requesterUser`, `requesterTeam`, `folder`; a failed `modelId` condition adds nothing), and the inspection adds `narrowedTeamId` (the team a matched team rule narrowed to), `candidateIds` (the first three candidates in the order the strategy considers them) and `candidateCount`. The evaluator has an `explain` mode used only by the inspector: it evaluates every condition of every rule and keeps walking after the deciding rule without assigning; live assignment at reach stays lazy and unchanged. There are still no per-person load numbers (D104). The editor composes the design's sentences from this data (the owner, the reason line, one row per rule with the tags Matched, Not matched and Skipped, the strategy line and the skipped people with the server's reasons), resolves the names it needs after the reference maps, marks the result out of date when the teams, strategy, toggle, rules, requester or folder change, and never re-runs a test by itself. A rejected test shows "Could not test routing: {server message}", a transport failure "Could not test routing: the server did not respond.", both with Try again.

**Refines** D95 and D118.

Covers R289, R300, R301. Decided 2026-10-18 (phase 9b plan, user answer Q55).

## D173. Apps supply their folders

The editor adapter lists the app's folders and names the folder type: `getFolderType(modelId)` (CMS `cms:<modelId>`, Website Builder `wb:page`) and `listFolders(modelId)` returning `AppFolder { id, path }` for the folders the admin can see (the ACO list is permission-filtered), the root excluded, the path built from folder titles as `/A/B`. The CMS and Website Builder packages implement them over the data-returning `ListFoldersGateway` of `@webiny/app-aco`; `app-workflows` does not depend on `app-aco`. The folder control is the shared searchable `WorkflowPicker` over these paths, with the clear rows "Any folder" (rule condition) and "Root (no folder)" (Test routing). A saved folder id that is not listed is told apart with `folderExists`: "Restricted folder" (preserved unchanged, the picker disabled, removable) or "Deleted folder". A folder condition of another type is kept unchanged.

**Refines** D69 and D133.

Covers R292, R298. Decided 2026-10-18 (phase 9b plan, user answer Q54).

## D174. Stale rule targets block Save

A rule target that no longer works is a rule error, on the client and on the server: no target ("Choose who this rule assigns to."), a user who is not in the reviewing teams ("{Name} is no longer in the reviewing teams."), a team that is not a reviewing team ("{Team} is not a reviewing team."), a deleted user ("The assigned user was deleted.") and a deleted team ("The team was deleted."). The errors are computed live (once references resolve, and again when the step's teams or rules change), shown on the rule card, the step card and the top of the drawer as `Rule {n}: {message}`, and block Save with the toast "Fix the highlighted steps before saving." Warnings never block: a deleted folder ("The folder no longer exists.") and a deleted requester team ("The team was deleted."). A restricted folder has only its field hint, and a deleted requester user shows the label "Deleted user" without a warning. A user whose teams are unknown (the lookup failed) is not flagged. A People step that is read-only (teams off) is not checked and never blocks Save.

**Refines** D46 and D61.

Covers R299, R304. Decided 2026-10-18 (phase 9b plan, user answers Q52, Q53).

## D175. 9b is editor-only

Phase 9b changes the workflow editor and the API it needs. It builds no `listStepCandidates` work and leaves the 8a `ReviewerPicker` as it is (the roadmap row 9b had both; they are not editor needs). Read access ("{Name} can't read {Model} content.") and exclusions ("{Name} is unavailable (excluded until ...)") are not shown in the editor: Test routing reports them through the server's skipped people. Every new operation is `editor`-only on the server and shown only to viewers with `editor` (D162). The `modelId` rule condition is preserved but has no editor (D42).

Covers R285, R306. Decided 2026-10-18 (phase 9b plan, user answers Q50, Q56).

## D176. Teams off disables People

With the teams feature off, `listStepTypes` reports the People (`review`) type as unavailable with the reason "Teams are not enabled." and the editor lists it disabled (D122); `listTeams` returns `{ teams: [], missingIds: [] }` without querying and `listUsers` returns no team data (D170). A saved People step loads read-only, with the card warning and the drawer notice "This step needs teams, which are not enabled. It can't be edited."; move and delete stay enabled and the step is saved untouched. Automation and AI steps work as before. The People step is read-only exactly when the `review` row of `listStepTypes` is not available.

Covers R290, R309. Decided 2026-10-18 (phase 9b plan, user answer Q58 and Q59.5).

## D177. The stock admin-ui groups hold items by reference

`RadioGroup`, `CheckboxGroup` and `Checkbox` of `@webiny/admin-ui` accept JSX labels: their presenters hold the items by reference instead of deep-observing them, which overflowed the stack. The 9a workarounds are removed: the Automation cards use `RadioGroup` and the AI tools list uses `CheckboxGroup` again, and the 9b controls (strategy cards, "Include subfolders") use the stock components directly.

Covers R305. Decided 2026-10-18 (phase 9b plan, user answer Q57).
"""
t = t.rstrip("\n") + NEW
p.write_text(t)
PY
```

If Step 2b changed the meaning of a note or decision (for example the Task 18 spike took the R293 fallback), edit the text in the script before running it: for D66 the fallback wording is `the reorderable rule list is edited by RoutingRulesRenderer over a list the drawer presenter holds, and the form carries a text field with only the summary error`.

- [ ] **Step 4: Spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`)**

```
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
rep("updated 2026-10-18 (phase 9a:", "updated 2026-10-18 (phase 9b: D170 listUsers can be scoped to teams; D171 rule errors name the rule; D172 the routing inspector answers for every rule; D173 apps supply their folders; D174 stale rule targets block Save; D175 9b is editor-only; D176 teams off disables People; D177 the stock admin-ui groups hold items by reference), earlier updated 2026-10-18 (phase 9a:")
rep("Consolidates decisions D1-D169", "Consolidates decisions D1-D177")

# 4.1 validation data
rep("`data: { stepId, field, workflowId }`", "`data: { stepId, field, ruleId, workflowId }`")
rep("Messages and codes are unchanged [D165].", "Codes are unchanged. A rule-level failure names the field `config.assignment.rules.target` and carries the rule's `ruleId` (a rule without a target, a user target who is not a member of the step's teams, a team target outside the step's teams, which is rejected on save); the two membership messages are rule-neutral, and schema issues keep `config.assignment.rules.<index>.<path>` [D165, D171].")

# section 10
rep("`listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }`, `listAutomationDefinitions`", "`listUsers(search, ids, limit, teamIds)` → `{ users: { id, displayName, teamIds }[], missingIds }`, `listAutomationDefinitions`")
rep("- `listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }` [D48, D104]; also accepts a list of ids (up to 200) and reports which do not exist, so the editor can show saved targets as \"Deleted user\" [D117]", "- `listUsers(search, ids, limit, teamIds)` → `{ users: WorkflowsListedUser { id, displayName, teamIds }[], missingIds }` [D48, D104, D170]; `teamIds` keeps the users who belong to any of those teams (combined with `search`); a list of ids (up to 200) is looked up ignoring `search`, `limit` and `teamIds` and reports which do not exist, so the editor can show saved targets as \"Deleted user\" [D117]; with the teams feature off no team is queried, `teamIds` is `[]` on every user and a `teamIds` request returns no users [D176]")
rep("`limit` defaults to 50 and is capped at 200 [D166].", "`limit` defaults to 50 and is capped at 200 [D166]. With the teams feature off it returns `{ teams: [], missingIds: [] }` without querying [D176].")
rep("- `inspectRouting(stepConfig, model, requesterId, folderId)` → resulting owner, per-rule trace (including skipped rules and why), strategy choice; evaluates unsaved config; returns no per-person load numbers [D45, D95, D104, D118]", "- `inspectRouting(stepConfig, model, requesterId, folderId)` → resulting owner, the trace of every rule in order (`matched`, `notMatched` with its failed conditions `requesterUser`, `requesterTeam` or `folder`, `skipped` with why, `notEvaluated` for the rules after the deciding one), the team a matched rule narrowed to, the first three candidate ids and the candidate count, strategy choice; evaluates unsaved config; returns no per-person load numbers; a rule-level failure uses the save messages, field and `ruleId` [D45, D95, D104, D118, D171, D172]")
rep("carries `{ stepId, field, workflowId }` in `data` (4.1) [D165].", "carries `{ stepId, field, ruleId, workflowId }` in `data` (4.1) [D165, D171].")

# 13.2
rep("Phase 9a built everything below except the assignment part, which is 9b.", "Phases 9a and 9b built everything below; the People step's Assignment and Test routing tabs are 9b.")
rep("(People: the teams joined with `+`; Automation:", "(People: the teams joined with `+`, the strategy (`Team pool`, `Round-robin` or `Least-loaded`), ` · 1 routing rule` or ` · {n} routing rules` and ` · requester can pick`; Automation:")
rep("warning lines (a team without members, a missing automation,", "warning lines (a team without members, `Rule {n}: ` lines for the rule warnings and rule errors of the assignment, a missing automation,")
rep("in one body (no tabs in 9a) [D56, D66, D168]", "in one body; a People step has the tabs General, Assignment and Test routing, the other types have no tabs [D56, D66, D168]")
rep("the `ui` hints `textarea` and `team`;", "the `ui` hints `textarea`, `team` and `user` (a searchable single-user picker over `listUsers`);")
rep("required automation settings, instructions, a model, a valid colour)", "required automation settings, instructions, a model, a valid colour, and the rule target checks of the Assignment tab [D174])")
rep("`name` or `steps` mark the name input or the \"No steps yet\" box;", "a rule-level error (`config.assignment.rules.target` with a `ruleId`) marks that rule card and its target field and the step card strip reads `Rule {n}: {message}` [D171]; `name` or `steps` mark the name input or the \"No steps yet\" box;")

PEOPLE = """- People step, General tab: `teams` through the shared searchable multi picker over `listTeams` (a team with no members shows "This team has no members"); the hint is "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab."
- People step, Assignment tab: the strategy as radio cards (stored `none`, `roundRobin`, `leastLoaded`; shown as `None (team pool)`, `Round-robin` and `Least-loaded` with the design's descriptions), the switch "Let the requester pick a reviewer" (independent of the strategy), and the ordered routing rules under "Routing rules" with the line "The first matching rule wins. If no rule matches, the strategy decides." and Add rule. A rule card is numbered, shows a readable summary, moves up or down (a keyboard move announces "Rule moved to position {position} of {total}."), is deleted, and has the conditions Requester is (a user), Requester is in team and Content is in folder with Include subfolders, and the target: the `{Team} team pool` of a reviewing team or a member of the reviewing teams. A new rule has no conditions and targets the pool of the first reviewing team. The editor writes back every condition and key it does not edit (the `modelId` condition, a folder of another type, unknown keys); a rule that carries such a condition reads "... and other conditions". Rule ids are created when a rule is added [D42, D46, D69, D72, D171].
- Saved references: the user, team and folder ids of rules are resolved by id for display and are never shown empty: "Deleted user", "Deleted team", "Restricted folder" (preserved unchanged, the picker disabled, removable) and "Deleted folder"; a failed lookup shows the banner "Could not load the step options." with Try again [D117]. The folders come from the app's editor adapter (CMS: the ACO folders of `cms:<modelId>`; Website Builder: `wb:page`), the root excluded, shown as title paths [D173].
- Rule issues: errors block Save, show on the rule card, the step card and the top of the drawer as `Rule {n}: {message}`, and are computed live: "Choose who this rule assigns to.", "{Name} is no longer in the reviewing teams.", "{Team} is not a reviewing team.", "The assigned user was deleted." and "The team was deleted."; warnings never block: "The folder no longer exists." and, for a requester team, "The team was deleted." The drawer's "Check this step" block lists the warnings and errors of the open step. A tab that holds an error shows an asterisk and the drawer shows "This step has an error on the {tab} tab." with Show; a step whose error is on the Assignment tab opens on it. Read access and exclusions are not shown here; Test routing reports them [D174, D175].
- People step, Test routing tab: pick a requester (user search) and optionally a folder, then Test routing runs `inspectRouting` on the step as it is on screen, unsaved edits included (the button is disabled with "Choose a requester to test." until a requester is picked and reads "Testing…" while it runs). The result shows the owner (a person or the team pool), the reason line, one trace row per rule (`Matched`, `Not matched` with the failed conditions, `Skipped`; "An earlier rule matched." for the rules after the deciding one), the strategy line and the skipped people with the server's reasons. The result is marked out of date when the teams, strategy, toggle, rules, requester or folder change and is never re-run automatically. A rejected test shows "Could not test routing: {server message}", a transport failure "Could not test routing: the server did not respond.", both with Try again [D95, D172].
- Teams off: the People type is listed disabled with "Teams are not enabled."; a saved People step is read-only with the notice "This step needs teams, which are not enabled. It can't be edited." (move and delete stay enabled); Automation and AI steps are unchanged [D122, D176]."""
rep_line("- People step:", PEOPLE)

rep_line("- Not in 9a, still to build:", "- Not in 9b: read-access and exclusion warnings in the editor (Test routing reports them), an editor for the `modelId` rule condition (it is preserved), and any change to the review dialog's `ReviewerPicker` (13.3). The exclusion settings page and the permission UI: 9c. Several workflows per model and secret settings are not planned.")
p.write_text(t)
PY
```

If Step 2 or Step 2b shows the code differs from a sentence (a copy text, the strategy descriptions, the "Check this step" block, the keyboard announcement, the Test routing labels), change the sentence, not the code.

- [ ] **Step 5: Roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`)**

```
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

rep("D1-D169", "D1-D177")
rep("**Not built:** the People step's Assignment and Test routing tabs, user and folder pickers and saved-reference resolution (9b); the settings page", "**Not built in 9a:** the People step's Assignment and Test routing tabs, user and folder pickers and saved-reference resolution (built in 9b); the settings page")
rep(". **Known gap before merge:** the automation and AI tool forms use `DeprecatedRadioGroup` and per-item checkbox renderers because admin-ui `RadioGroup`, `CheckboxGroup` and `Checkbox` overflow the stack with JSX labels; fix them in admin-ui and switch back | 3, 5, 7 |", ". The known gap of the automation and AI tool forms (the admin-ui `RadioGroup`, `CheckboxGroup` and `Checkbox` overflowed the stack with JSX labels) was closed in 9b (D177) | 3, 5, 7 |")

ROW9B = "| 9b. Admin: assignment editor | **Built** (plan `docs/.bruno/plans/2026-10-18-workflows-phase-9b/`, eight sub-phases): the People step drawer's General, Assignment and Test routing tabs; the strategy radio cards, the requester-pick switch and the reorderable routing rule list with conditions (requester user, requester team, folder with subfolders) and targets (a team pool or a member), readable summaries, and rule warnings and errors (stale targets block Save on the client and the server, D174); saved user, team and folder references resolved for display (D117); the shared searchable pickers for users, teams and folders, the folders supplied by each app's editor adapter (D173); per-app gateways for `inspectRouting` and `folderExists` and the shared `listUsers` gateway (D133); Test routing on the unsaved step (D172); on the API side `listUsers` team scope (D170), `ruleId` in validation error data and the team-target check on save (D171), the richer `inspectRouting` answer (D172) and teams off (D176); the admin-ui `RadioGroup`, `CheckboxGroup` and `Checkbox` fix with the 9a forms switched back (D177). Spec 4.1, 10 and 13.2 describe the result. **Not built:** `listStepCandidates` gateways (not an editor need; the 8a `ReviewerPicker` stays, D175); read-access and exclusion warnings in the editor (Test routing reports them); an editor for the `modelId` rule condition (preserved only) | 4, 9a | 4.1, 10, 13.2 |"
rep_line("| 9b. Admin: assignment editor", ROW9B)
p.write_text(t)
PY
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
```

The awk line prints one number six times (equal numbers). If Step 2b shows that a roadmap row 9c or another row states something 9b changed (a grep of `9b` in the roadmap), correct it in the same script.

- [ ] **Step 6: Guides (`docs/.bruno/workflows/`)**

**6a. `app.md`.**

```
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

rep("phases 8a, 8b and 9a (2026-10-16 to 2026-10-18, D157-D169); section 3 is the workflow editor of 9a.", "phases 8a, 8b, 9a and 9b (2026-10-16 to 2026-10-18, D157-D177); section 3 is the workflow editor of 9a and 9b.")
rep("## 3. Workflow editor (9a, as built)", "## 3. Workflow editor (9a and 9b, as built)")

add_to_line("- `WorkflowEditorAppAdapter` (", " 9b adds `getFolderType(modelId)` (CMS `cms:<modelId>`, WB `wb:page`) and `listFolders(modelId)` returning `AppFolder { id, path }` (the folders the admin can see, root excluded, `/A/B` paths built from titles); the CMS and WB adapters implement them over `ListFoldersGateway` of `@webiny/app-aco`, registered through `ListFoldersGqlGateway` in each `features/editorMounting/feature.ts`. `app-workflows` never imports `app-aco` (D173).")

add_to_line("- Gateways and use cases:", " 9b adds `inspectRouting(params)` and `folderExists(params)` to the per-app gateway and use cases (CMS sends the bare model id; WB ignores `modelId` and the folder type) and `listUsers({ search, ids, teamIds, limit })` to the shared `WorkflowConfigGateway` and `WorkflowConfigUseCases` (D170, D172). The shared `WorkflowEditorUseCases` class carries the new methods and the per-app subclasses inherit them (R237).")

add_to_line("- Domain and model:", " 9b adds the typed assignment (`[AWE]/model/assignment/`: `AssignmentValue`, `RuleValue`, `RuleFolderValue`, `RuleTargetValue`; `readAssignment`, `assignmentToConfig`, which keep every key the editor does not edit in `preserved`), `createRuleId`, the rule helpers (`[AWE]/model/rules/`: add, move, remove and update a rule, `getReferenceLabel`, `describeRule`, `getRuleIssues`), `getStepErrorTab`, and the Test routing composer (`[AWE]/model/testRouting/`: `composeTestRoutingResult`, `getTestRoutingSignature`). `validateWorkflowDraft` adds the rule target errors (D174), `getStepSummary` names the strategy, the rule count and the requester pick, and `getStepWarnings` adds the `Rule {n}: ` lines and the teams-off line.")

add_to_line("- Presenters: `WorkflowEditorPresenter`", " 9b: the editor presenter resolves the saved user, team and folder ids of rules (users in chunks of 200, rule teams, folders from the adapter's list then `folderExists`; a run token drops stale responses; a failure shows the banner \"Could not load the step options.\" with Try again), loads the user, member and folder options, exposes `getModelId()`, `inspectRouting` and the inspection name lookup, and maps rule errors by `ruleId` in `mapSaveError`. The drawer presenter holds the People assignment, the tabs (`showErrorTab`, opening on the tab of an error), the live rule issues, the `Check this step` warnings, the teams-off read-only state and the Test routing state of the open step (a run token, a signature taken when the request is sent, cleared when another step opens).")

add_to_line("- Step forms and renderers:", " 9b: a People form has the FormModel layout tabs General, Assignment and Test routing; `assignment` is a form object with `strategy`, `allowManualPick` and `rules`, where `rules` is a plain-JSON array field edited by `RoutingRulesRenderer` (its cards are under `renderers/routingRules/`); the strategy cards are `AssignmentStrategyRenderer` over the stock `RadioGroup`; the Test routing tab is the layout element `workflowTestRouting` (`TestRoutingRenderer`, under `renderers/testRouting/`), which reads its data from `StepFormOptionsContext`; `UserPickerRenderer` and `FolderPickerRenderer` serve the rule fields and the Automation `user` hint. The shared `PickerOption` gained `muted`, `disabled` and `icon`, and `WorkflowPicker` the `anyLabel` clear row.")

rep_line("- Known limits:", "- Known limits: model rows carry no step count (QBZ-20 forbids counts per row), so the sub line of an unopened bound model is the bound workflow's name. Deviations from the design in 9b: a new rule targets the pool of the first reviewing team, not its first member (that needs a member lookup before the card appears); a tab with an error shows FormModel's asterisk after the label, not the design's dot; picker rows have an icon column but no avatar and no right-hand note; a rule with a condition the editor cannot show (`modelId`, unknown keys) reads \"... and other conditions\". Read access and exclusions are shown only by Test routing. The automation cards use `RadioGroup` and the AI tools list `CheckboxGroup` again (9b closed the 9a gap, D177).")

head = "## 9. Open for 9b and 9c\n"
assert t.count(head) == 1
i = t.index(head)
t = t[:i] + """## 9. Open for 9c

- 9c: the exclusion settings page and the workflows permission UI. The role form does not grant `reassign` yet; the admin already reads it (D162).
- Not built in the editor: read-access and exclusion warnings (Test routing reports them), an editor for the `modelId` rule condition (preserved only), `listStepCandidates` gateways and any change to the 8a `ReviewerPicker` (D175).
- Not planned: several workflows per model, secret settings.
"""
p.write_text(t)
PY
```

If Step 2 shows the R293 spike took the fallback (the rule array in the drawer presenter), replace `where `rules` is a plain-JSON array field edited by `RoutingRulesRenderer`` with `where the rule array lives in the drawer presenter, edited by `RoutingRulesRenderer`, and `rules` is a text field that carries only the summary error`. If a renderer name differs from the contract, use the as-built name.

**6b. `api.md`** (a discovery snapshot of 2026-10-01; it is extended, not refreshed).

```
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/api.md")
t = p.read_text()
old = "sections 11 and 12 list what phases 8b and 9a added (decisions D160-D169 carry the rest)."
assert t.count(old) == 1
t = t.replace(old, "sections 11 to 13 list what phases 8b, 9a and 9b added (decisions D160-D177 carry the rest).")
t = t.rstrip("\n") + """

## 13. Phase 9b additions (as built)

- **`workflows.listUsers` team scope (D170).** `ListWorkflowUsersUseCase` (`src/features/config/ListWorkflowUsers/`) takes `teamIds` and returns `WorkflowListedUser { id, displayName, teamIds }` (GraphQL `WorkflowsListedUser`; `WorkflowsUser` stays for owners and candidates). It lists the users with the api-core admin users use case (the `teams_in` filter) and reads each user's team ids from the listed user; an `ids` lookup ignores `search`, `limit` and `teamIds`. It injects the api-core `FeatureFlags` and reads `TEAMS_FEATURE_FLAG` (`advancedAccessControlLayer.teams`, `src/constants.ts`) on every call: with teams off it queries no teams, returns `[]` as `teamIds` and returns no users for a `teamIds` request.
- **Rule error data (D171).** `WorkflowValidationErrorData` gained `ruleId`. The three rule messages are constants in `src/domain/workflow/ruleErrorMessages.ts`, used by `ReviewStepType`, `StoreWorkflowUseCase` and `InspectRoutingUseCase`; rule-level failures set `stepId`, `ruleId` and the field `config.assignment.rules.target`. `StoreWorkflowUseCase` rejects a team target outside the step's teams. Schema issues keep `config.assignment.rules.<index>.<path>`.
- **`inspectRouting` (D172).** The trace lists every rule (`WorkflowsRoutingTraceOutcome` gained `notEvaluated`), `WorkflowsRoutingTraceEntry.failedConditions` lists `WorkflowsRoutingCondition` values (`requesterUser`, `requesterTeam`, `folder`), and `WorkflowsRoutingInspection` gained `narrowedTeamId`, `candidateIds` (the first `INSPECTION_CANDIDATE_LIMIT` = 3) and `candidateCount`. `RoutingEvaluateParams.explain` switches the evaluator to inspector mode (every condition of every rule evaluated, the rules after the deciding one walked and marked `notEvaluated`); live assignment does not set it and stays lazy.
- **Teams off (D176).** `ReviewStepType` reports `available: false` with `unavailableReason` "Teams are not enabled." when the flag is off; `ListWorkflowTeamsUseCase` returns `{ teams: [], missingIds: [] }` without querying (the `editor` gate and the 200-ids refusal stay).
- **Tests.** `__tests__/__helpers/teamsFlag.ts` is a `FeatureFlags` decorator that turns the teams flag on or off for a test; flags are empty by default, so teams are off unless a test turns them on.
"""
p.write_text(t)
PY
```

**6c. `integrations.md`.**

```
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/integrations.md")
t = p.read_text()

def add_to_line(prefix, extra):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = lines[hits[0]] + extra
    t = "\n".join(lines)

add_to_line("- Workflow editor (9a): `features/editorGateway/` (`CmsWorkflowEditorGateway`", " Phase 9b: the gateway gained the `inspectRouting` and `folderExists` documents (`graphql/inspectCmsEntryRouting.ts`, `graphql/cmsEntryFolderExists.ts`; the bare model id and a `null` folder for the root), and the adapter gained `getFolderType` (`cms:<modelId>`) and `listFolders` over `ListFoldersGateway` of `@webiny/app-aco`, which is a dependency of this package and is registered through `ListFoldersGqlGateway` in `editorMounting/feature.ts` (D173).")
add_to_line("- Workflow editor (9a): `features/editorGateway/` (the WB mirror", " Phase 9b: the same two documents (`graphql/inspectWebsiteBuilderPageRouting.ts`, `graphql/websiteBuilderPageFolderExists.ts`; no model and no folder type), and the adapter's `getFolderType` (`wb:page`) and `listFolders` over `ListFoldersGateway`, with `@webiny/app-aco` as a dependency (D173).")
add_to_line("- Workflow editors (9a): each app mounts the shared `WorkflowEditorView`", " 9b: each app also supplies its folders to the editor through the adapter (`getFolderType`, `listFolders`), so `app-workflows` does not depend on `app-aco`; the People step's Assignment and Test routing tabs run on the per-app `inspectRouting` and `folderExists` operations.")
p.write_text(t)
PY
```

**6d. `automations.md`.** Replace the `user` hint sentence:

```
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/automations.md")
t = p.read_text()
old = "A `user` hint has no picker until 9b and renders as plain text."
assert t.count(old) == 1
t = t.replace(old, "A `user` hint renders a searchable single-user picker over `listUsers` (9b, D168); any other unknown hint falls back to the plain field.")
p.write_text(t)
PY
```

**6e. `README.md`.**

```
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/README.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

rep("as built in phases 8a, 8b and 9a (shared review core", "as built in phases 8a, 8b, 9a and 9b (shared review core")
rep("the workflow editor as built in phase 9a.", "the workflow editor as built in phases 9a and 9b.")
rep("the workflow editor (phase 9a) | review core and editor tested |", "the workflow editor (phases 9a and 9b) | review core and editor tested |")
p.write_text(t)
PY
```

If an `old` text is not found because the README sentence was reworded, find the sentence (`grep -n "9a" docs/.bruno/workflows/README.md`) and change the `old` string, not the intent.

- [ ] **Step 7: Final greps (the proof)**

```
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -rnE "until 9b|arrive with 9b|moves to 9b|Not in 9a|no tabs in 9a|nown gap before merge|DeprecatedRadioGroup|CheckboxPrimitiveRenderer|plain text until|still to build|replaces the 8a|carried unchanged" docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/workflows/automations.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-110
grep -n "D1-D169\|D157-D169\|D160-D169" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md docs/.bruno/workflows/app.md docs/.bruno/workflows/api.md | cut -c1-90
grep -n "^## D17[0-7]\." docs/.bruno/workflows/decisions.md
grep -n "Refined by D171\|Built in phase 9b\|Extended in phase 9b\|Refined by D168" docs/.bruno/workflows/decisions.md | cut -c1-70
grep -n "D1-D177" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-70
grep -n "^## 3\.\|^## 7\.\|^## 8\.\|^## 9\." docs/.bruno/workflows/app.md
grep -n "^## 13\." docs/.bruno/workflows/api.md
grep -n "^### 13.2\|^### 13.3" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
git diff --stat | tail -12
yarn format:check 2>&1 | tail -5
```

Expected: the first grep prints nothing; the second prints nothing (the spec's 13.3 `ReviewerPicker` line is not searched by these phrases; `decisions.md` is not in the list because D66 and D168 keep historical sentences with their "Built in" notes); the third prints nothing (the old ranges are rewritten; a hit in a historical line of `api.md` or `app.md` that names a past phase is acceptable only if the commit body says so); the fourth prints the eight headings D170-D177; the fifth prints the nine notes (D46, D61, D66, D69, D95, D117, D118, D165, D168); the sixth shows both files; the seventh prints `## 3. Workflow editor (9a and 9b, as built)`, `## 7. Bugs`, `## 8. Duplication and dead code`, `## 9. Open for 9c`; the eighth prints `## 13. Phase 9b additions (as built)`; the ninth prints `### 13.2 Workflow editor` and `### 13.3 Request review dialog` once each; the tenth prints one number six times; `git diff --stat` lists only the nine docs files of this task; `yarn format:check` is clean for the touched files (run `yarn format:fix > /dev/null 2>&1` first if it reports wrapped lines in the markdown).

- [ ] **Step 8: Format, pre-commit chain and commit**

Docs only: no package source or `package.json` changed in this task, so `yarn adio`, `yarn check-ts-configs` and the package builds have nothing to prove; they still run as part of the chain.

```
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

`git status --short` must list only the docs files of this task (decisions, spec, roadmap, `app.md`, `api.md`, `integrations.md`, `automations.md`, `README.md`) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then (put one line per recorded execution ruling and per renamed contract name into the third `-m` body, after `Execution rulings recorded:` and `Names corrected against the code:`; write `none` where there is nothing):

```
git commit -m "docs(workflows): record phase 9b (D170-D177), spec 4.1, 10 and 13.2 and the guides as built" -m "Adds D170 (listUsers can be scoped to teams), D171 (rule errors name the rule), D172 (the routing inspector answers for every rule), D173 (apps supply their folders), D174 (stale rule targets block Save), D175 (9b is editor-only), D176 (teams off disables People) and D177 (the stock admin-ui groups hold items by reference), adds notes to D46, D61, D66, D69, D95, D117, D118, D165 and D168, updates spec 4.1, 10 and 13.2, marks roadmap row 9b built (no listStepCandidates, the 8a ReviewerPicker stays) and closes the 9a known gap, and extends app.md, api.md, integrations.md, automations.md and README.md for the as-built phase 9b code." -m "Execution rulings recorded: <one line each, or none>. Names corrected against the code: <one line each, or none>." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. The contract's Task 25 entry lists `decisions.md` (D170-D177, notes on D46, D61, D66, D69, D95, D117, D118, D165), spec 13.2, 10 and 6, roadmap row 9b and the 9a "known gap", `app.md`, `api.md` and `integrations.md`. This task adds a note on D168 (its body says the tabs arrive with 9b and the `user` hint has no picker), spec 4.1 (the validation data) and the status line, `automations.md` (the `user` hint sentence) and `README.md` (the phase list and the package table). Spec section 6 needs no edit: its inspector sentence (exclusions shown as "Skipped") is what Test routing now does, and the teams-off behaviour is recorded in 10 and 13.2; if Step 2 shows otherwise, correct it in the Step 4 script.
2. R310 names D170-D176 while the contract's Decisions section defines D177 (Q57, R305); eight decisions are recorded and the range is D1-D177.
3. The roadmap row 9b names `listStepCandidates` gateways and `WorkflowUserPicker` / `WorkflowTeamPicker` / folder picker; Q56 removes the first and the editor uses the shared `WorkflowPicker` for all three, so the row is rewritten, not annotated.
4. `app.md` line "9b reuses the shared `WorkflowPicker` and `WorkflowMultiPicker` and replaces the 8a `ReviewerPicker` with them" is removed with section 9 (it is rewritten as "Open for 9c" plus a "Not built in the editor" bullet that says the `ReviewerPicker` stays).
5. Renderer, helper and file names of 9b (`AssignmentStrategyRenderer`, `RoutingRulesRenderer`, `TestRoutingRenderer`, `UserPickerRenderer`, `FolderPickerRenderer`, `workflowTestRouting`, the model helper names, `ruleErrorMessages.ts`, `teamsFlag.ts`) come from the contract's Interfaces by task; the other 9b task files were written in parallel, so Step 2 checks each and a renamed one is corrected in the doc and listed in the report.
6. The handoff file is not part of this task; the user decides at the end of the phase.

## Review fixes (sub-phase review)

1. Step 6a renames the `app.md` section 3 heading to `## 3. Workflow editor (9a and 9b, as built)` (its intro sentence already says 9a and 9b); the Step 7 expectation follows. No other file links to the old heading (checked).
2. Verified against the current docs: every `old` anchor of Steps 3 to 6 occurs exactly once (spec, roadmap, decisions D46-D169, `app.md`, `api.md`, `integrations.md`, `automations.md`, `README.md`); every Step 2 path exists in the repo or is created by a 9b task file (`ruleErrorMessages.ts`, `teamsFlag.ts`, `inspectCmsEntryRouting`, `cmsEntryFolderExists`, `inspectWebsiteBuilderPageRouting`, `websiteBuilderPageFolderExists`); contract names and design strings quoted in the docs match the 9b.2-9b.7 task files; section 9 of `app.md` is the last section, so the Step 6a replacement drops nothing.
