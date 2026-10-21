### Task 23: Decisions D165-D169, spec, roadmap and guides

R267-R284, D165-D169 (`../00-shared.md` "Decisions"), Q41-Q48 of `../00-answers.md`, the Global Constraint "SEC ids only in plan files", spec 4.1, 7.2, 10, 13.1 and 13.2 as built; roadmap rows 7, 9a (built) and 9c. A docs task: no TDD cycle, no code. The proofs are greps before and after, a claim-by-claim check of every statement against the as-built code (Step 2), and the pre-commit chain. **Every claim below is a claim about code Tasks 1-22 built: Step 2 checks each against the tree before the text is written, and a claim the code contradicts is corrected in the doc, never kept and never fixed in code.** The 9a task files were written in parallel, so a contract name that a task renamed is fixed here and recorded in the commit body and under "Contract notes" of the executor's report.

- **Decisions:** append D165 (validation errors point at the step and field), D166 (workflows lists teams), D167 (the AI step editor ships with the editor), D168 (step forms per type), D169 (colour presets are theme tokens) to `docs/.bruno/workflows/decisions.md` (last entry today is D164). Notes on D66 (refined by D168), D92 (built, refined by D165) and D122 (copy as built). D167 also records the `changesContent` flag (R283, Q46); there is no D170.
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): status line and decision range; 4.1 (`definitionId` is `automationId`, the validation error data); 7.2 (the editor side of automations); 10 (`listTeams`, the validation error data); 13.1 (the seven configuration operations, the editor gate); 13.2 (the editor as built).
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D169, row 7 (Notify via is built), row 9a built with what stays unbuilt, row 9c (AI step editor moved to 9a).
- **Guides** (`docs/.bruno/workflows/`): `app.md` (intro, sections 1, 2, 3 rewritten, 5, 6, 7, 8, 9), `api.md` (new section 12), `integrations.md` (package bullets, section 5, section 6 item 12), `automations.md` (how the editor renders settings and its validation messages), `ai-tools.md` (the `changesContent` property), `notifications.md` (unlisted transport ids), `README.md` (index and package table). No other guide describes the old editor: `routing.md` is the product brief (kept), `bugs.md`, `open-questions.md` and `infrastructure.md` have no editor statement that 9a changes (Step 1 greps prove it); `ai-tools.md` gains the new tool flag only.
- **No SEC id** anywhere in the committed files. Plan files may keep them. There is no handoff file in this task (the user decides at the phase end).

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `api.md`, `integrations.md`, `automations.md`, `ai-tools.md`, `notifications.md`, `README.md`

**Interfaces:**
- Consumes: the whole phase (Tasks 1-22 as committed) and the `## Decisions` and `## Rulings` of `../00-shared.md` (D165-D169, R267-R284, A97-A100, Q41-Q48 of `../00-answers.md`); existing docs as quoted in the steps below (every `old` text is unique and is checked by the `grep -cF` in the step that uses it).
- Produces: the recorded decisions D165-D169 and the as-built documentation, no code. Acceptance: Step 7 prints what it says; D165-D169 contain no SEC id; `yarn format:check` is clean for the touched files.

**How to apply an edit:** each "Replace `old` with `new`" below is an exact-string replacement made with the Edit tool on the named file (`old` must occur exactly once; run `grep -cF "<old>" <file>` first, it must print 1). "Append after" means: replace `old` with `old` followed by the new text. The two block splices of `app.md` (sections 3 and 7-9) are made by the Python snippet in Step 6a, which asserts that each marker occurs once. Table rows of the roadmap keep their pipe structure.

- [ ] **Step 1: Baseline greps (the "failing test")**

Run from the repository root:

```
grep -rnE "kept until 9a|until 9a-9c|until phases 9a|must move from|has no tests|not type-aware|fire-and-forget|editor not tested" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-100
grep -n "definitionId" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D164" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-60
grep -rnE "WorkflowsEditor|CmsWorkflowsEditor|PageWorkflows|WorkflowStepModel|listWorkflowNotificationTypes" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/workflows/bugs.md docs/.bruno/workflows/open-questions.md docs/.bruno/workflows/ai-tools.md docs/.bruno/workflows/notifications.md docs/.bruno/workflows/automations.md | cut -c1-70
grep -c "^## D16[5-9]\." docs/.bruno/workflows/decisions.md
```

Expected at plan time: the first grep hits `app.md` lines 3, 15, 90, 97, 106, 108, 110, 112, `README.md` lines 9 and 21 (the words "editor not"), 48 and 91, `integrations.md` lines 42 and 52, and the roadmap line 25 (`must move from`); the second hits spec line 92; the third prints nothing (SEC ids live only in the gitignored `docs/.reports/security.md` and in plan files); the fourth shows the spec status line and the roadmap header; the fifth hits `app.md` (sections 3, 5, 6, 7) and `integrations.md` (lines 42, 52, 133, 134, 170), and nothing in `README.md`, `bugs.md`, `open-questions.md`, `ai-tools.md`, `notifications.md` or `automations.md` (the README lines are found by the first grep; the two small additions to `automations.md` and `notifications.md` are new facts, not corrections); the last prints `0`.

- [ ] **Step 2: Check every claim against the as-built code**

For each line run the command and fix the doc text in the later steps if the code differs (the contract names are the expectation; a rename found here is recorded in the commit body):

```
# API (9a.1)
grep -n "WorkflowValidationErrorData\|stepId\|workflowId" packages/api-workflows/src/domain/workflow/errors.ts
grep -rn "export.*parseAutomationSettingsIssue\|AutomationSettingsIssue" packages/api-workflows/src --include=*.ts | grep -v test | head -5
grep -rln "new WorkflowValidationError(" packages/api-workflows/src packages/ai-powerups/src packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src | grep -v test
grep -rn "field: \"models\"" packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src packages/api-workflows/src | grep -v test | head -8
grep -rn "stepId" packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts | head -3
ls packages/api-workflows/src/features/config/ListWorkflowTeams
grep -n "listTeams\|WorkflowsTeamSummary\|WorkflowsTeamListResult\|memberCount" packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
grep -rn "TEAM_LIST_LIMIT\|Too many team ids" packages/api-workflows/src --include=*.ts | grep -v test | head -5
# Admin foundations (9a.2)
ls packages/app-admin/src/features/formModel/jsonSchema
grep -n "jsonSchema\|JsonSchema" packages/app-admin/src/index.ts
ls packages/app-workflows/src/components/picker
grep -rn "More matches. Keep typing to narrow the list.\|Unknown item\|This team has no members" packages/app-workflows/src/components packages/app-workflows/src/editor --include=*.ts --include=*.tsx | grep -v test | head -5
# Editor core, model, presenter (9a.3-9a.4)
ls packages/app-workflows/src/editor packages/app-workflows/src/editor/{domain,gateway,useCases,toasts,model,presentation}
grep -rn "EDITOR_WORKFLOW_FIELDS" packages/app-workflows/src/editor/gateway/editorFields.ts
grep -rn "invalidateWorkflows" packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts packages/app-workflows/src/review/useCases/ReviewUseCases.ts
grep -rn "WorkflowEditorAppAdapter" packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts
grep -rn "250\|PAGE_SIZE\|limit: 20" packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts | head -5
grep -rn "var(--color-" packages/app-workflows/src/editor/domain/stepColours.ts | head -10
grep -rn "matchesAutomationScope" packages/app-workflows/src/editor/model/matchesAutomationScope.ts
grep -rn "savedOn" packages/app-workflows/src/editor/model/WorkflowDraft.ts packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts | head -5
# Step editor and view (9a.5-9a.6)
ls packages/app-workflows/src/editor/presentation/stepForm packages/app-workflows/src/editor/presentation/stepForm/renderers packages/app-workflows/src/editor/presentation/stepDrawer
grep -rn "FieldRenderer" packages/app-workflows/src/editor/WorkflowEditorConfig.tsx | head -8
grep -rn "560" packages/app-workflows/src/editor/presentation/stepDrawer | grep -v test | head -3
ls packages/app-workflows/src/editor/presentation/editor/components packages/app-workflows/src/editor/presentation/editor/components/dialogs packages/app-workflows/src/editor/presentation/editor/components/banners
grep -rn "addTransitionGuard\|beforeunload" packages/app-workflows/src/editor --include=*.ts --include=*.tsx | grep -v test | head -4
grep -rn "SortablePresenter" packages/app-workflows/src/editor --include=*.ts --include=*.tsx | grep -v test | head -3
# App glue and cleanup (9a.7)
ls packages/app-headless-cms-workflows/src/features/editorGateway packages/app-website-builder-workflows/src/features/editorGateway
grep -rn "/cms/workflows" packages/app-headless-cms-workflows/src --include=*.ts --include=*.tsx | grep -v test | head -3
grep -rn "/website-builder/workflows" packages/app-website-builder-workflows/src --include=*.ts --include=*.tsx | grep -v test | head -3
grep -rn "CmsWorkflowEditorAppAdapter\|renderModelIcon" packages/app-headless-cms-workflows/src --include=*.ts --include=*.tsx -l | grep -v test
grep -rn "getWorkflowsPermissionSet" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --include=*.ts --include=*.tsx | grep -v test | head -4
ls packages/app-workflows/src/presentation packages/app-workflows/src/features 2>&1 | head
ls packages/app-headless-cms-workflows/src/presentation packages/app-website-builder-workflows/src/Components 2>&1 | head
grep -rnE "IWorkflowApplication|HasWorkflowsEditorPermission|Components.Admin|WorkflowsEditor" packages/*/src --include=*.ts --include=*.tsx -l | grep -v "/editor/" | head
cat packages/app-workflows/src/index.tsx
grep -rn "WorkflowsPermissions" packages/app-workflows/src --include=*.ts --include=*.tsx | grep -v test | head -4
```

In the same pass read, so the prose below is true: the string of every design text the docs quote or paraphrase (`Fix the highlighted steps before saving.`, `Workflow saved`, `Could not save. Check the highlighted step.`, `Someone else changed this workflow`, `This workflow was deleted`, `Discard unsaved changes?`, `Delete workflow?`, `This workflow can't be deleted yet`, `Could not save the workflow`, `Requires the AI Power-Ups licence.`, `No automations are available for this model.`, `No automations are available for pages.`, `Enter a hex colour, e.g. #3B6FD4.`) with `grep -rn "<string>" packages/app-workflows/src/editor | grep -v test | head -2`; the zod `.meta` key the JSON schema carries a UI hint in (`grep -rn "ui:" packages/app-workflows/src/editor/presentation/stepForm packages/app-admin/src/features/formModel/jsonSchema | grep -v test | head`); the field names the CMS and WB gateways use for the model row (`WorkflowModelRow`); whether `listCmsEntryWorkflowModels` filters private models (`grep -rn "isPrivate" packages/api-headless-cms-workflows/src | grep -v test | head -3`); and what `[AW]/index.tsx` exports after Task 22. If a name or text differs, change the doc sentence, not the code, and list the change under "Contract notes" of the report.

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

3a. Append at the end of the file (after D164, one blank line first). Format as the neighbours (heading `## D<n>. Title`, body, last paragraph "Covers ... Decided ..."):

```markdown

## D165. Validation errors point at the step and field

`Workflows/Workflow/Validation` carries `data: { stepId, field, workflowId }`, every key `null` when it does not apply. A workflow-level error (`stepId` null) names `name`, `models` or `steps` in `field`; a step-level error names the step and the field (`id`, `title`, `type`, `color`, `notifications`, `config.teams`, `config.assignment.rules`, `config.automationId`, `config.settings` or `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools`, or `config.<zod issue path>` for a review config issue). The path inside automation settings comes from `parseAutomationSettingsIssue`, a sibling of `parseAutomationSettings` that returns the first issue as `{ path, message }`. The duplicate-model error (same code) also carries the `workflowId` of the workflow that already holds the model, so the editor can name it and offer to open it. Messages and codes do not change; the CMS and Website Builder before-create and before-update handlers and the app-mismatch guards set `field: "models"`.

The editor validates on the client first and uses the server error as the fallback: the step and field are marked, the first failing card scrolls into view, and an error whose field has no form field shows the server message on the card and at the top of the drawer until the step is edited. A server error with no step and no field shows as the banner "Could not save the workflow — {server message}".

**Refines** D92: the exact step, rule or field the decision promised is now what the server names.

Covers R267, R276, R281. Decided 2026-10-18 (phase 9a plan, user answers Q41, Q43).

## D166. Workflows lists teams for the editor

The shared configuration query `workflows { listTeams(search, ids, limit) }` returns `{ teams: [{ id, name, memberCount }], missingIds }`, for viewers with `editor`; a search is sorted by name and an `ids` request keeps the order of the request. `search` is a case-insensitive name filter, `ids` returns those teams and reports unknown ones in `missingIds` (more than 200 ids is refused with the Validation error `Too many team ids.`, the `listUsers` rule), `limit` defaults to 50 and is capped at 200. Only the team lookup and the member count run without authorization (the `listUsers` pattern): the count is one user-list scan per request, users carry their teams, and only a number leaves the server, never a member. The `WorkflowsTeam` type stays for review steps; the new `WorkflowsTeamSummary` is the picker's row. The member count drives the design's "This team has no members" warning.

Covers R268. Decided 2026-10-18 (phase 9a plan, user answer Q42; the member count was added by the planner).

## D167. The AI step editor ships with the editor

Phase 9a builds the full AI step editor: instructions (required), the model picker over `listAiModels` with its empty, failed, no-model and retired-model states (a stored model that is no longer listed shows as retired with a warning and does not block saving), the tool allowlist over `listAiTools` (stored tool names that are not listed are kept and not shown), and the licence warning. Without the licence (the `ai` step type unavailable, or no config schema) AI cards are disabled with the reason and an existing AI step is read-only; moving and deleting it stay enabled. Phase 9c keeps only the exclusion settings page and the permission UI. AI tools declare an optional `changesContent` flag (absent means false; `readTarget` false, `updateTargetFields` true) that `listAiTools` returns; the editor shows it as the tag "Changes content" on the tool and as " · can change content" in the step summary.

Covers R275, R283. Decided 2026-10-18 (phase 9a plan, user answers Q44, Q46).

## D168. Step forms per type

The step drawer builds one FormModel form per step: the common fields (Title, Colour, Description, Notify via) and the type's own config fields, in one body. The People form edits `teams` and carries `assignment` unchanged (a new step starts with `{ strategy: "none", allowManualPick: false, rules: [] }`); the Automation form is generated from the definition's JSON schema by `buildFieldsFromJsonSchema` in `@webiny/app-admin`; the AI form is hand-built. There is no dynamic zone and, in 9a, no tabs (the Assignment and Test routing tabs arrive with 9b). A step of an unknown type is shown read-only and saved unchanged. The adapter maps string (with `enum`, the `ui` hints `textarea` and `team`), number and integer with bounds, boolean, object, a list of strings, a list of objects, and anything else to a JSON text field; `createJsonSchemaValidator` rebuilds the validator with `z.fromJSONSchema`, never throws, and reports every value valid for a schema it cannot rebuild. A `user` hint has no picker yet and falls back to plain text.

**Refines** D66: the dynamic zone and `ObjectAccordionMultipleRenderer` rule list are replaced by one form per type for now, and the rule list moves to 9b.

Covers R270, R271, R274. Decided 2026-10-18 (phase 9a plan).

## D169. Colour presets are theme tokens

A step's colour is a string the server already stores. The editor offers ten presets stored as the theme's CSS variable strings (Orange `var(--color-primary-500)`, Rust `var(--color-primary-800)`, Amber `var(--color-warning-600)`, Olive `var(--color-warning-800)`, Teal `var(--color-success-500)`, Green `var(--color-success-800)`, Red `var(--color-destructive-500)`, Maroon `var(--color-destructive-700)`, Gray `var(--color-neutral-500)`, Ink `var(--color-neutral-900)`) and a custom colour stored as `#RRGGBB`. A new step takes Orange. A loaded colour that is neither a preset nor a hex is kept; a hex shows as custom, anything else as no selection. An invalid hex blocks Save with "Enter a hex colour, e.g. #3B6FD4." and an unfinished hex stays in the field without reaching the draft.

Covers R273. Decided 2026-10-18 (phase 9a plan).
```

3b. Three notes in place:

1. D66. Append after the line `Resolves A3.` that closes D66 (it is the line directly before `## D67. Secret config fields`; use the anchor `Resolves A3.\n\n## D67. Secret config fields` and replace it with `Resolves A3.\n\n_Refined by D168 (phase 9a): one FormModel form per step type instead of a dynamic zone, built by `buildFieldsFromJsonSchema`; UI hints reach the adapter as the JSON schema's `ui` property (`textarea`, `team`; `user` falls back to plain text until 9b); the reorderable rule list moves to 9b._\n\n## D67. Secret config fields`.

2. D92. Replace `## D92. UI: explicit workflow save\n\nThe workflow editor edits the whole workflow and saves explicitly (no per-step save, no auto-save). It tracks unsaved changes, warns before leaving, and shows server validation errors on the exact step, rule or field.` with the same text followed by a blank line and:

```
_Built in phase 9a: Save is enabled only when the draft is dirty, the router and `beforeunload` guards ask before leaving, switching the model asks, and server validation errors reach the step and field through D165 (rule-level marking arrives with 9b)._
```

3. D122. Append to the end of D122's paragraph (it ends `otherwise the disabled row stays._`) a new paragraph (blank line first):

```
_Built in phase 9a with the design's copy: AI shows "Requires the AI Power-Ups licence."; Automation shows "No automations are available for this model." (CMS) or "No automations are available for pages." (Website Builder); any other unavailable type shows the server's `unavailableReason`. An automation is addable when one definition's scope covers the model (`*`, `<app>.*` or the exact namespace)._
```

(check each anchor first: `grep -c "^Resolves A3\.$" docs/.bruno/workflows/decisions.md` prints 1; `grep -cF "so the disabled row stays" ...` is not used, use `grep -cF "otherwise the disabled row stays._" docs/.bruno/workflows/decisions.md`, which prints 1; `grep -c "^## D92\. UI: explicit workflow save$" docs/.bruno/workflows/decisions.md` prints 1.)

- [ ] **Step 4: Spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`)**

Edit in this order (each `old` text is unique; run `grep -cF "<old>" <file>`, which must print 1):

1. Status line (line 3). Replace `Status: draft, 2026-10-05, updated 2026-10-17 (phase 8b:` with `Status: draft, 2026-10-05, updated 2026-10-18 (phase 9a: D165 validation errors point at the step and field; D166 workflows lists teams for the editor; D167 the AI step editor ships with the editor; D168 step forms per type; D169 colour presets are theme tokens), earlier updated 2026-10-17 (phase 8b:`, and `Consolidates decisions D1-D164` with `Consolidates decisions D1-D169`.

2. Section 4.1, the step config. Replace `    definitionId: string;` with `    automationId: string;` (the interface block of `AutomationStepConfig`; section 7.2 and the code already say `automationId`).

3. Section 4.1, the validation bullet list. Append after the line `- Designed for many-to-many in v2 (several models per workflow, several workflows per model) [D15].`:

```
- A validation failure carries `data: { stepId, field, workflowId }` (null where it does not apply): `stepId` and `field` name the step and the field (`name`, `models`, `steps` for the workflow; `title`, `type`, `color`, `notifications`, `config.teams`, `config.automationId`, `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools` and the review config paths for a step), and the duplicate-model error also carries the `workflowId` of the workflow that holds the model. Messages and codes are unchanged [D165].
```

4. Section 7.2. Replace `the editor renders the form from the schema, which `listAutomationDefinitions` exposes as JSON schema.` with `the editor renders the form from the schema, which `listAutomationDefinitions` exposes as JSON schema, through the JSON-schema adapter of 13.2 [D168].`

5. Section 10. Replace `- Operations that take a review id take no model; a request takes the revision id and the server derives the content id from it.` with the text below followed by that sentence:

```
- Teams (9a): `workflows { listTeams(search, ids, limit) }` returns `{ data: { teams: [WorkflowsTeamSummary { id, name, memberCount }], missingIds }, error }` for viewers with `editor` (a search is sorted by name, an `ids` request keeps the request order); `search` is a case-insensitive name filter, more than 200 `ids` fail with `Too many team ids.`, `limit` defaults to 50 and is capped at 200 [D166].
```

and replace `Errors return `code`, `message` and `data`; the admin must keep them (today gateways drop them).` with `Errors return `code`, `message` and `data`; the admin keeps them (`GraphQLOperationError`). `Workflows/Workflow/Validation` carries `{ stepId, field, workflowId }` in `data` (4.1) [D165].`

6. Section 13.1. Replace `The six shared configuration operations (settings, users, step types, notification transports, automation definitions, AI tools) have one gateway [D132, D133].` with `The shared configuration operations of the editor (step types, automation definitions, notification transports, teams, AI models, AI tools) have one gateway and one use-case token; settings and users are not read by the 9a editor [D132, D133, D166].` (check Step 2: if `listUsers` is read by the editor after 9b only, the sentence stays true for 9a.)

   Then append to the bullet `- Per-viewer flags come from the server; ...` (replace its closing `the server keeps every check [D162].` with the text below):

```
the server keeps every check [D162]. The workflow editor's route, menu item and configuration queries are one more such gate: they show only to viewers with `editor`.
```

7. Section 10, the `listAiTools` descriptors (two places). Replace `AI tools (`listAiTools`) and AI models` with `AI tools (`listAiTools` → `{ name, title, description, changesContent }`) and AI models`, and replace ``listAiTools` → `{ name, title, description }[]`` with ``listAiTools` → `{ name, title, description, changesContent }[]`` (each `grep -cF` prints 1; the second old text is inside the long `workflows` root bullet) [D167, R283].

8. Section 13.2. Replace the whole body (every line from `- Bound to models (`models`), one model per workflow in v1.` to `- The assignment section is shown only for review steps.`, ending directly before `### 13.3 Request review dialog`) with the text below. Use the same Python splice style as Step 6a: markers `### 13.2 Workflow editor\n` and `### 13.3 Request review dialog\n`, asserting each occurs once.

```markdown
### 13.2 Workflow editor

One shared view in `app-workflows`, mounted per app at `/cms/workflows` and `/website-builder/workflows`; the route, the menu item and every configuration query show only to viewers with the workflows `editor` permission (a display gate, the server keeps its checks) [D162]. Phase 9a built everything below except the assignment part, which is 9b.

- Bound to models (`models`), one model per workflow in v1. A panel lists the models. CMS: `listCmsEntryWorkflowModels`, 20 per page, server search (debounced 250 ms, a new search restarts at the first page), Load more, "No models match “{q}”." when empty. Website Builder: the single item Pages (panel label "Website Builder", shown uppercase by the panel's style, no search). Each row shows the model icon, the name, a sub line (`{n} steps` for the open workflow, the bound workflow's name for other bound models, "No workflow" otherwise), the bound indicator and a dot for unsaved changes on the open model. Create workflow starts a draft named "{Model} review", dirty from the start [D116].
- Steps: a Draft card, the numbered step cards with a `+` between them, a Published card; an empty workflow shows "No steps yet" and Add step. Add step opens a picker with one card per step type in the order `listStepTypes` returns, named People (`review`), Automation and AI (D98); an unavailable type is listed and disabled with its reason (D122), and the type cannot be changed later (D91). Each card shows the title, the type tag, a summary line (People: the teams joined with `+`; Automation: the automation's name; AI: `{Model} · n tool(s)` with ` · can change content` when a tool can write, or `No model chosen · 0 tools`), warning lines (a team without members, a missing automation, settings that no longer validate, a retired AI model, the missing licence) and, after a failed save, the error strip. Cards reorder by drag (the shared `SortablePresenter`) or with the up and down buttons.
- Step drawer (560 px, from the card's edit button): one FormModel form per step with the common fields (Title, Colour, Description, Notify via) and the type's own fields, in one body (no tabs in 9a) [D56, D66, D168]. Done applies the form to the draft; X, Escape and the scrim keep the edits too, and an unfinished hex colour keeps the old colour (only Done is blocked by it). Nothing is stored until the workflow is saved. Colour: ten theme presets stored as CSS variable strings and a custom `#RRGGBB` [D169]. Notify via: one checkbox per transport from `listNotificationTransports`; a new People step starts with `e-mail` ticked, unlisted ids on a loaded step are kept on save and not shown, and the text "Only in-app notifications are available. No other channels are configured." shows when there are no transports [D96, D129, D151].
- People step: `teams` through the shared searchable multi picker over `listTeams` (a team with no members shows "This team has no members"); `assignment` is carried unchanged and edited in 9b.
- Automation step: radio cards of the definitions whose scope covers the model; the settings form is generated from the definition's JSON schema through a JSON-schema to FormModel adapter in `@webiny/app-admin` (string, enum, number and integer with bounds, boolean, object, list of strings, list of objects; anything else is a JSON text field; the `ui` hints `textarea` and `team`; required from the schema's `required` unless the field has a default). The validator is rebuilt with `z.fromJSONSchema` and flags stored settings that no longer validate [D14, D35, D37, D66, D168]. Switching to another automation with settings entered asks first. A stored automation that no longer exists shows a warning.
- AI step: Instructions, Model (single picker over `listAiModels`, required; a stored model that is no longer listed shows as retired with a warning and does not block saving) and Tools (checkboxes over `listAiTools`; unlisted names are kept and not shown), only when the `ai` type is available; without the licence AI cards are disabled and an existing AI step is read-only, with move and delete still enabled [D101, D109, D138, D139, D167].
- Save is explicit and enabled only when the draft is dirty [D92]. The client validates first (name, at least one step, a title per step, at least one team, required automation settings, instructions, a model, a valid colour); on failure the failing steps are marked, the first scrolls into view and a toast says to fix the highlighted steps or fields. The store mutation carries the loaded `savedOn` string unchanged (null for a new workflow or Save as new). Server errors map back: a validation error with a `stepId` marks that step and field (a field with no form field shows the message on the card and at the top of the drawer); `name` or `steps` mark the name input or the "No steps yet" box; a duplicate-model error shows the banner "Could not save the workflow — {Model} already has a workflow: “{name}”." with Reload; any other validation error shows "Could not save the workflow — {server message}"; a conflict opens "Someone else changed this workflow" with Keep editing and Reload workflow; a deleted workflow opens "This workflow was deleted" with Discard changes and Save as new workflow [D123]; a transport failure shows the banner "Could not save the workflow" with Try again. The draft stays dirty after every failure [D131, D165].
- A successful save makes the returned workflow the baseline, updates the model row and refreshes the review UI's cached workflow list, so the bar, requests and lists see the new steps without a reload.
- Delete asks "Delete workflow?" (finished reviews keep their history). When reviews are in progress the server refuses and the dialog "This workflow can't be deleted yet" shows the count, up to five of the reviews (title, `Step {n} of {N} · {step}`, linked to the content) and, by the viewer's `reassign` permission, how to proceed [D115]. Delete step asks first.
- Leaving with unsaved changes asks (switching the model, leaving the route through the router, and the browser's own prompt while dirty) [D92].
- Not in 9a, still to build: the People step's Assignment section (strategy selector, `allowManualPick` toggle, reorderable rule list, rule inspector, `WorkflowUserPicker` over `listUsers`, `WorkflowTeamPicker` limited to the step's teams, the standard `FolderPicker` with "restricted folder" preserved and the invalid-target flags of D69, D72, D61) and saved-reference resolution (D117): 9b. The exclusion settings page and the permission UI: 9c. Several workflows per model and secret settings are not planned.
```

If Step 2 shows the as-built code differs from a sentence (a copy text, the 20 per page, the debounce, the card summary lines, the Draft and Published cards, the five listed reviews), change the sentence, not the code.

- [ ] **Step 5: Roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`)**

1. Header (line 7): replace `D1-D164` with `D1-D169`.
2. Row 7. Replace ``the "Notify via" list (9a), which must move from the stale `listWorkflowNotificationTypes` gateway in `app-workflows` to `listNotificationTransports` | 3 | 12 |`` with ``the "Notify via" list, built in 9a over `listNotificationTransports` (D129, D151) | 3 | 12 |``.
3. Row 9a, the middle cell. Replace the text between `| 9a. Admin: editor foundation | ` and ` | 3, 5, 7 | 13.2 |` (it starts with `Per-app editor gateways (saves through each app's store mutation);` and ends with `delete the old editor`) with:

```
**Built** (plan `docs/.bruno/plans/2026-10-18-workflows-phase-9a/`, eight sub-phases): the new editor at `/cms/workflows` and `/website-builder/workflows` for viewers with `editor` (D162), over per-app editor gateways (saves through each app's store mutation with `savedOn`, D131) and one shared configuration gateway; the CMS paged, server-searched model list (D116) and the single Pages item for the Website Builder; create, edit and delete a workflow; add steps by type with unavailable types listed and disabled (D122); a 560px step drawer on FormModel with the common fields, Notify via (D129, D151) and one form per type (People teams, the Automation form generated by the JSON-schema adapter in `app-admin`, the full AI step editor, D167, D168); reorder by drag or up and down; explicit save with client validation first, server errors on the step and field (D165), and the conflict, deleted-while-editing (D123), duplicate-model, blocked-delete and transport-failure dialogs and banners; the leave guard (D92); review cache invalidation after save and delete; the shared searchable Picker; `workflows.listTeams` (D166); the `changesContent` flag on AI tools (D167); a `destructive` variant of the admin-ui `Button` for the destructive dialog actions; step colours as theme tokens (D169); the old editor deleted. Spec 4.1, 7.2, 10, 13.1 and 13.2 describe the result. **Not built:** the People step's Assignment and Test routing tabs, user and folder pickers and saved-reference resolution (9b); the settings page and the permission UI (9c); several workflows per model; secret settings; model-delete dialog changes (no phase assigned)
```

   Also replace `| 3, 5, 7 | 13.2 |` with `| 3, 5, 7 | 4.1, 7.2, 10, 13.1, 13.2 |` (the string occurs once, in row 9a; `grep -cF "| 3, 5, 7 | 13.2 |"` prints 1).
4. Row 9c. Replace `; AI step editor (model required, D101); workflows permission UI (custom access) | 1b, 4, 6, 9a |` with `; workflows permission UI (custom access) and granting `reassign` in the role form. The AI step editor moved to 9a (D167) | 1b, 4, 6, 9a |`.

Check the table: `awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` prints one number six times (6 at plan time; if the rows differ at plan time, the numbers must still all be equal).

- [ ] **Step 6: Guides (`docs/.bruno/workflows/`)**

**6a. `app.md`** (run `grep -cF` on each `old` first, it must print 1).

1. Intro line (line 3). Replace the whole sentence pair `Sections 1, 2 and 4-6, 8 and 9 describe the code as built in phases 8a and 8b (2026-10-16 and 2026-10-17, D157-D164). Section 3 (the workflow editor) and the bugs of section 7 are the 2026-10-01 discovery notes for the editor code that stays until phases 9a-9c.` with `Everything below describes the code as built in phases 8a, 8b and 9a (2026-10-16 to 2026-10-18, D157-D169); section 3 is the workflow editor of 9a. The 2026-10-01 discovery notes on the old editor went with it.` Also replace `Path roots:` is untouched; add the root after the `[API]` line: replace `- `[API]` = `packages/api-workflows/src`` with `- `[API]` = `packages/api-workflows/src`\n- `[AWE]` = `[AW]/editor` (the 9a workflow editor; `[AW]/review/editor` is the 8a review session)`.

2. Section 1, layout. Replace ``  - Editor code (kept until 9a-9c): `domain/` (workflow models, permission schema), `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes,permissions}/`, `presentation/{workflowsEditor,permissions}/`, `hooks/canUseWorkflows.ts`.`` with:

```
  - The workflow editor, `editor/` (section 3), and the shared `components/picker/` (`WorkflowPicker`, `WorkflowMultiPicker`, `PickerOption`, `limitPickerOptions`).
  - The permission code that stays: `domain/permissionsSchema.ts`, `features/permissions/`, `presentation/permissions/` (Task 22 deleted `hooks/canUseWorkflows.ts` with the old editor).
```

3. Section 1, public API. Replace ``- Public API (`[AW]/index.tsx`): `WorkflowsAdminApp`, `useCanUseWorkflows`, `useWorkflowsPermission`, `IWorkflowApplication`, the kept feature objects and `Components.{Permissions,Admin}`. Phase 8a adds nothing to this barrel:`` with ``- Public API (`[AW]/index.tsx`): `WorkflowsAdminApp`, `useWorkflowsPermission` and `WorkflowsPermissionsFeature` (nothing else; the old editor's exports went with it in 9a). Phases 8a and 9a add nothing to this barrel:``; then replace `(every admin package exports `"./*": "./*"`).` (end of that bullet) with `(every admin package exports `"./*": "./*"`); the editor (`WorkflowEditorRoute`, `WorkflowEditorMenu`, `WorkflowEditorView`, `WorkflowEditorAppAdapter`, the editor use-case interfaces) is imported the same way by the CMS and WB packages.`

4. Section 1, the Routes bullet. Replace `Routes: none in `[AW]`. Content Reviews routes are per app:` with `Routes: none in `[AW]`. The editor routes are per app (`/cms/workflows` in `[CMS]`, `/website-builder/workflows` in `[WB]`, each shown only when `getWorkflowsPermissionSet(identity).editor` is true), and so are the Content Reviews routes:`.

5. Section 2, Tests bullet. Replace `the review core and the app packages are covered, the kept editor code is not.` with `the review core, the editor and the app packages are covered. The editor's pure builders and vitest fakes are in `[AWE]/testing/` (they ship in `dist` like `review/testing`: the builders import no vitest, mobx or DI, the fakes live in separate files, R243).`

6. Section 2, Layering. Append after the sentence `Shared presenters receive `useCases` as an `init(...)` argument; app glue resolves its token and passes it in.`:

```
 The editor follows the same rule (9a): the shared `WorkflowEditorUseCases` class (R237) is subclassed per app (`CmsWorkflowEditorUseCasesImpl`, a WB mirror), and the view receives `useCases`, `reviewUseCases` and the app's `WorkflowEditorAppAdapter` as props and passes them to `WorkflowEditorPresenter.init`.
```

7. Section 3. Replace the whole section (from `## 3. Workflow editor\n` to the line before `## 4. Content review flows (as built)\n`) and sections 7 to 9 (from `## 7. Bugs (open, editor code kept until 9a-9c)\n` to the end of the file) with the Python snippet below. It asserts that each marker occurs exactly once.

```
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/app.md")
t = p.read_text()

S3 = '''## 3. Workflow editor (9a, as built)

The editor of 9a replaced the discovery-era one (deleted in 9a, D168). `[AWE]` is `[AW]/editor`; `[AW]/review/editor` is the unrelated review session of 8a.

- Mounting and gate: `WorkflowEditorView` (`[AWE]/presentation/editor/components/`) is one shared view. The route and the menu item are written once in `[AWE]/mounting/components/` (`WorkflowEditorRoute`: `AdminConfig.Route`, layout, title "Workflows", breadcrumbs, the view; `WorkflowEditorMenu`: the pinnable "Workflows" menu link); both render nothing without the `editor` permission (`useWorkflowsPermission().editor`, D162) and there is no `SecureRoute`. Each app adds a mount component (`CmsWorkflowEditor` in `[CMS]/Routes/`, `/cms/workflows`; `WebsiteBuilderWorkflowsMenu` in `[WB]/Routes/`, `/website-builder/workflows`) and a mounting feature in `features/editorMounting/` (`CmsWorkflowEditorMountingFeature`, `WbWorkflowEditorMountingFeature`) whose `resolve` returns `{ useCases, reviewUseCases, app }`; these are passed to the view as props and on to `WorkflowEditorPresenter.init`. The server keeps its checks. Without the `advancedPublishingWorkflow` flag nothing is registered; every editor feature is registered in `[AW]/app.tsx` and `app.test.tsx` asserts it with the flag on and off.
- `WorkflowEditorAppAdapter` (`[AWE]/WorkflowEditorAppAdapter.ts`) is what differs per app: `{ appKind: "cms" | "wb", panelLabel, appliesToLabel, init(), renderModelIcon(modelId), contentAdapter }`. The CMS adapter (`CmsWorkflowEditorAppAdapter`, `[CMS]/features/editorMounting/`; its `init` swallows a failure, the icon is cosmetic) lists the models once into the admin `ModelsCache` in `init()` and renders the icon through the CMS icon component (`app-workflows` has no icon library); the WB adapter's `init()` is a no-op and its `panelLabel` is `Website Builder` (shown uppercase by the panel's style). `contentAdapter` is the app's existing `IReviewContentAdapter`, used to link the reviews of the blocked-delete dialog.
- Gateways and use cases: `IWorkflowEditorGateway { listModels, getWorkflow, storeWorkflow, deleteWorkflow }` per app (`[CMS]/features/editorGateway/` over the `cms` root, `[WB]/features/editorGateway/` over `websiteBuilder`; the WB `listModels` returns the single `wb.page` row `Pages` with its bound workflow from `listWebsiteBuilderPageWorkflows`). The shared `WorkflowEditorUseCases` (`[AWE]/useCases/`, a plain class, R237) maps the gateway's DTOs to the domain types (`EditorWorkflow`, `EditorStep`, `WorkflowModelRow`, ...) and throws `GraphQLOperationError` for an envelope error. The shared configuration operations run through one `WorkflowConfigGateway` and `WorkflowConfigUseCases` (tokens, one implementation each, `[AWE]/gateway/` and `[AWE]/useCases/`, over `MainGraphQLClient` on the `workflows` root): `listStepTypes`, `listAutomationDefinitions`, `listNotificationTransports`, `listTeams`, `listAiModels` (called only when the AI type is available) and `listAiTools`.
- Domain and model: `[AWE]/domain/` holds the types, `WorkflowErrorCode` (`NotFound`, `Conflict`, `Validation`, `Persistence`, `HasActiveReviews`, `NotAuthorized`) and `stepColours.ts` (ten theme presets stored as CSS variable strings, D169). `[AWE]/model/WorkflowDraft.ts` is the MobX draft (name, steps, baseline; `isDirty`; a draft for a new workflow has no baseline and is dirty; `toInput()` emits the review defaults, keeps unknown transport ids, unknown AI tools and `assignment`); next to it are the pure helpers `createNewStep`, `validateWorkflowDraft` (the client rules of R276), `getStepTypeOptions` (availability, with `matchesAutomationScope` mirroring the server's scope rule `*`, `<app>.*`, exact namespace), `getStepSummary` and `getStepWarnings`. The draft stays inside the presenters; the view gets render-ready VMs (R234).
- Presenters: `WorkflowEditorPresenter` (`[AWE]/presentation/editor/`) owns the model list (search debounced 250 ms, 20 per page for the CMS, Load more), option loading (a failure shows the banner "Could not load the step options." with Try again), the draft, the dialogs (`vm.dialog`, one render-ready kind at a time) and the banners, and resolves the team ids of a loaded workflow with one `listTeams({ ids })`. The editor presenter owns `openStep`, `closeStep`, `vm.openStepId` and `vm.scrollRequest` (the step to scroll to after a failed save; adding a step opens it). The step drawer has its own presenter (`StepDrawerPresenter`, `[AWE]/presentation/stepDrawer/`) that reads the editor presenter through `StepDrawerSource` (`<StepDrawer source={presenter} stepId={vm.openStepId} />`); closing by Done, X, Escape or the scrim keeps the edits, and an unfinished hex keeps the old colour (only Done is blocked by it). The drawer: one FormModel form per step (`[AWE]/presentation/stepForm/`: `buildCommonFields`, `buildPeopleStepForm`, `buildAutomationStepForm`, `buildAiStepForm`), a server error on a field or at the top of the drawer until the step is edited, Done applies the form to the draft, and a step of an unknown type opens read-only.
- Save and errors (R276, D165): the store mutation carries the loaded `savedOn` string unchanged (null for a new workflow and for Save as new). `mapSaveError` maps the result: a `Validation` error with a `stepId` marks that step and field; `name` or `steps` mark the name input or the "No steps yet" box; a `workflowId` reads the other workflow's name with `getWorkflow` and shows the duplicate banner with Reload; `Conflict` opens "Someone else changed this workflow"; `NotFound` opens "This workflow was deleted" (Discard changes, Save as new workflow); a transport error shows the banner "Could not save the workflow" with Try again. The draft stays dirty after every failure. After a save and after a delete the presenter calls `reviewUseCases.invalidateWorkflows()` (R277), which clears the shared `ReviewUseCases` cached workflow list including a pending load. Delete maps `HasActiveReviews` to the blocked dialog (count, up to five reviews linked through `contentAdapter.getContentUrl`, the closing sentence by the viewer's `reassign`).
- Step forms and renderers: the field renderers are registered by the JSX config component `WorkflowEditorConfig` (`AdminConfig.Form.FieldRenderer` entries, mounted in `WorkflowsAdminApp`): `StepColourRenderer`, `TeamsPickerRenderer`, `TransportCheckboxesRenderer`, `AutomationCardsRenderer`, `AiModelPickerRenderer`, `AiToolsRenderer`. They read their option VMs (items, `loading`, `failed`, `retry`) from `StepFormOptionsContext`, which the drawer provides from the presenter's data. The Automation settings form is generated by `buildFieldsFromJsonSchema` from `@webiny/app-admin` with `uiRenderers: { team: <the teams picker renderer> }`; stored settings are checked with `createJsonSchemaValidator`, and the card shows "Saved settings no longer validate: {error}" only while the admin has not changed them in the session. The pickers are the shared `WorkflowPicker` and `WorkflowMultiPicker` (`[AW]/components/picker/`): at most 50 visible options then "More matches. Keep typing to narrow the list.", an unknown selected id as "Unknown item", and a per-option warning.
- Cards, drawer and dialogs: `WorkflowFlow` and `StepCard` (reorder by drag through the admin `SortablePresenter`, registered by `SortableFeature`, or by the up and down buttons), `StepTypePicker`, `StepDrawer` (560 px), the dialogs under `components/dialogs/` (destructive actions use the admin-ui `Button` `destructive` variant, added in 9a), the banners under `components/banners/` and toasts through `IWorkflowEditorToasts` (`[AWE]/toasts/`, over the admin `Notifications`, D125; the 8a `ReviewToasts` stays review-only). `useLeaveGuard` registers `useRouter().addTransitionGuard` (the `ContentModelEditor.tsx` pattern) and a `beforeunload` listener only while the draft is dirty.
- Known limits: model rows carry no step count (QBZ-20 forbids counts per row), so the sub line of an unopened bound model is the bound workflow's name; the People hint shows only its first sentence until 9b; a `user` UI hint in an automation schema renders as plain text until 9b.

'''

S789 = '''## 7. Bugs

None open in the editor. The five bugs of the 2026-10-01 snapshot (the dead "no access" alert, gateways that dropped error `code` and `data`, the `window.close` dialog button, the save that did not wait for the server and showed its snackbar early, and the case-sensitive app search) went with the old editor in 9a.

## 8. Duplication and dead code

- The editor's DTO fields are defined once, in `EDITOR_WORKFLOW_FIELDS` (`[AWE]/gateway/editorFields.ts`); the API input and type are the only other place a new step field needs adding.
- Dead: DI `WorkflowsPermissions` (registered, never consumed; the legacy `useSecurity().getPermission("workflows")` is what runs).

## 9. Open for 9b and 9c

- 9b: the People step's Assignment and Test routing tabs (strategy, manual pick, rule list, inspector, tab error dots), the user and folder pickers, saved-reference resolution (D117) and rule warnings. 9b reuses the shared `WorkflowPicker` and `WorkflowMultiPicker` and replaces the 8a `ReviewerPicker` with them.
- 9c: the exclusion settings page and the workflows permission UI. The role form does not grant `reassign` yet; the admin already reads it (D162).
- Not planned: several workflows per model, secret settings.
'''

a = "## 3. Workflow editor\n"
b = "## 4. Content review flows (as built)\n"
c = "## 7. Bugs (open, editor code kept until 9a-9c)\n"
for m in (a, b, c):
    assert t.count(m) == 1, m
i, j, k = t.index(a), t.index(b), t.index(c)
assert i < j < k
t = t[:i] + S3 + t[j:k] + S789
p.write_text(t)
PY
```

8. Section 5. Replace ``- The kept editor gateways still use the `workflows` root: `listWorkflows`, `storeWorkflow`, `deleteWorkflow` and the stale `listWorkflowNotificationTypes` (9a moves it to `listNotificationTransports`).`` with:

```
- Editor operations (9a), one document per file: CMS `[CMS]/features/editorGateway/graphql/` over the `cms` root (`listCmsEntryWorkflowModels`, `getCmsEntryWorkflow`, `storeCmsEntryWorkflow`, `deleteCmsEntryWorkflow`); WB `[WB]/features/editorGateway/` over the `websiteBuilder` root (`listWebsiteBuilderPageWorkflows`, `getWebsiteBuilderPageWorkflow`, `storeWebsiteBuilderPageWorkflow`, `deleteWebsiteBuilderPageWorkflow`). The shared fields are `EDITOR_WORKFLOW_FIELDS` (`[AWE]/gateway/editorFields.ts`, including `notifications { id }`, `savedOn`, `createdOn`, `savedBy`, `createdBy`); `savedOn` travels as the `DateTime!` string and is sent back unchanged. The configuration operations of the `workflows` root (`listStepTypes`, `listAutomationDefinitions`, `listNotificationTransports`, `listTeams`, `listAiModels`, `listAiTools`) go through one `WorkflowConfigGateway`.
```

9. Section 6. Replace ``and from the editor side `Components.Admin.WorkflowsEditor`, `Components.Permissions.HasWorkflowsEditorPermission`, `IWorkflowApplication` and `useCanUseWorkflows`.`` with ``and, for the editor, `WorkflowEditorView` with a per-app `WorkflowEditorAppAdapter` and a per-app subclass of `WorkflowEditorUseCases` (bound to the app's editor gateway), plus `getWorkflowsPermissionSet` for the editor gate.``

**6b. `api.md`** (a discovery snapshot of 2026-10-01; it is not refreshed, only extended).

1. Replace `section 11 lists what phase 8b added (decisions D160-D164 carry the rest).` with `sections 11 and 12 list what phases 8b and 9a added (decisions D160-D169 carry the rest).`
2. Append at the end of the file (blank line first):

```markdown

## 12. Phase 9a additions (as built)

- **Validation error data (D165).** `WorkflowValidationError` (`src/domain/workflow/errors.ts`) takes an optional second argument `WorkflowValidationErrorData { stepId, field, workflowId }` (each `string | null`, default `null`), exposed as `data`. The sites that set it: `WorkflowValidator` (name, models, steps, step id, title, type, color, notifications), `ReviewStepType` (`config.teams`, `config.assignment.rules`, the review config zod path), `AutomationStepType` (`config.automationId`, `config.settings`, `config.settings.<path>`), `StoreWorkflowUseCase` (the duplicate model sets `field: "models"` and the other workflow's `workflowId`), `AiStepType` in `ai-powerups` (`config.instructions`, `config.model`, `config.tools`), and the CMS and WB before-create and before-update handlers and app-mismatch guards (`field: "models"`). Codes and messages did not change. `parseAutomationSettingsIssue(schema, settings)` returns `Result<unknown, AutomationSettingsIssue { path, message }>`; `parseAutomationSettings` and its callers are unchanged.
- **`workflows.listTeams` (D166).** `ListWorkflowTeamsUseCase` (`src/features/config/ListWorkflowTeams/`, built like `ListWorkflowUsers`) lists teams with api-core `ListTeamsUseCase` and counts members with one `ListUsersUseCase` call per request, both inside `identityContext.withoutAuthorization`; the `editor` check runs outside it. `search` filters by name in memory, `ids` reports unknown ones in `missingIds` and refuses more than 200 (`Too many team ids.`), `limit` defaults to 50 and is capped at 200; a search is sorted by name and an `ids` request keeps the request order. The GraphQL types are `WorkflowsTeamListResponse`, `WorkflowsTeamListResult { teams, missingIds }` and `WorkflowsTeamSummary { id, name, memberCount }`; `WorkflowsTeam` stays for review steps.
```

**6c. `integrations.md`.**

1. In `### api-headless-cms-workflows` append after the `- Phase 8b wrappers (...)` bullet (the last bullet of that section):

```
- Phase 9a: the before-create and before-update handlers and the app-mismatch guard set `field: "models"` on their `WorkflowValidationError` data (D165); `listCmsEntryWorkflowModels` is the editor's model list (D116).
```

2. In `### api-website-builder-workflows` append after the `- Phase 8b wrapper: ...` bullet:

```
- Phase 9a: the app-mismatch guard sets `field: "models"` on its `WorkflowValidationError` data (D165); `listWebsiteBuilderPageWorkflows` gives the editor's single `Pages` row its bound workflow.
```

3. In `### app-headless-cms-workflows` replace ``- Workflow editor (kept until 9a): `CmsWorkflowsEditorPresenterFeature` (lists models as workflow "apps"), `CmsWorkflowsEditor` (route `/cms/workflows`).`` with:

```
- Workflow editor (9a): `features/editorGateway/` (`CmsWorkflowEditorGateway` with the four documents over the `cms` root, `CmsWorkflowEditorUseCases` with the subclass `CmsWorkflowEditorUseCasesImpl`, registered from the package root); `features/editorMounting/` (`CmsWorkflowEditorAppAdapter`: `init` lists the models into the admin `ModelsCache`, `renderModelIcon` through `normalizeIcon` and the CMS icon component; `CmsWorkflowEditorMountingFeature`, which resolves the use cases, the `CmsReviewUseCases` and the adapter); and the mount component `CmsWorkflowEditor` (`Routes/`), which renders the shared `WorkflowEditorRoute` and `WorkflowEditorMenu` of `app-workflows` at `/cms/workflows`. The menu item and the route show only with the workflows `editor` permission and the feature flag (D162).
```

4. In `### app-website-builder-workflows` replace ``- Workflow editor (kept until 9a): `WebsiteBuilderWorkflowsMenu` (route `/website-builder/workflows`, one hard-coded "Pages" app).`` with:

```
- Workflow editor (9a): `features/editorGateway/` (the WB mirror of the CMS gateway and use cases; `listModels` returns the single `wb.page` row `Pages`); `features/editorMounting/` (`WbWorkflowEditorAppAdapter`, `panelLabel` `Website Builder`, `init` a no-op; `WbWorkflowEditorMountingFeature`); and `WebsiteBuilderWorkflowsMenu` (`Routes/`), which renders the shared `WorkflowEditorRoute` and `WorkflowEditorMenu` at `/website-builder/workflows`. The menu item gained the `editor` gate it lacked (D162).
```

5. Section 5. Replace the three lines `- Workflow editors wrap `Components.Admin.WorkflowsEditor` with `apps`.`, `  - CMS: one app per publishable non-singleton model. Menu entry guarded by `HasWorkflowsEditorPermission` and `canCreateContentModels` (`CmsWorkflowsEditorView.tsx`). Route guarded by `useCanUseWorkflows` + `SecureRoute permission="cms.contentModel"` (`Routes/CmsWorkflowsEditor.tsx`); the view checks `canCreateContentModels` only.` and `  - WB: one hard-coded "Pages" app. Route uses `SecureRoute permission="wb.page"` (`Routes/WebsiteBuilderWorkflowsMenu.tsx`). No `HasWorkflowsEditorPermission` wrapper on the menu (`PageWorkflowsEditorView.tsx`).` with:

```
- Workflow editors (9a): each app mounts the shared `WorkflowEditorView` with its own `WorkflowEditorAppAdapter` and editor use cases (see `app.md` section 3). CMS: the models come from `listCmsEntryWorkflowModels` (paged, server-searched, so the client no longer filters publishable models by literal tags). WB: the single item Pages. Route, menu and config queries show only with the `editor` permission.
```

   (the Python-free way: replace each of the three old lines in turn, the first with the new bullet and the other two with nothing; run `grep -cF` on each.)

6. Section 6, item 12. Replace ``12. "Publishable" rules duplicated: API `isModelAllowed` + `$publishing:false` check; app editor presenter filters `$publishing:false` and `"singleEntry"` by literal strings (`CmsWorkflowsEditorPresenter.ts:25-30`), while `ContentEntryFormWorkflow` uses `CMS_MODEL_SINGLETON_TAG` (= `"singleEntry"`, `app-headless-cms-common/src/constants.ts:1`). Unlike API `isModelAllowed`, the app does not filter `isPrivate`.`` with `12. "Publishable" rules: the API `isModelAllowed` + `$publishing:false` check is now the only copy used for the editor's model list (the old app presenter that filtered by literal strings was deleted in 9a, D116); `ContentEntryFormWorkflow` still uses `CMS_MODEL_SINGLETON_TAG` (`app-headless-cms-common/src/constants.ts:1`).` (Step 2: the `isPrivate` grep decides whether the sentence stays; if the list does not filter private models, say so instead.)

7. The note above section 6's list. Replace `describe admin code deleted in phase 8a (D159).` with `describe admin code deleted in phase 8a (D159) or, for the old workflow editor (items 9 and 12 mention it), in phase 9a.`

**6d. `automations.md`.** Append after the sentence ending `Avoid custom refinements on fields the editor has to render.` (replace it with itself followed by):

```
 The admin builds the form with `buildFieldsFromJsonSchema` (D168): a string is a text input (an `enum` a select; the `ui` hint `textarea` a textarea, `team` a team picker), a number or integer a number input with its bounds, a boolean a switch, an object a group, a list of strings a tag list, a list of objects a repeatable group, and any other shape (a union, a record) a JSON text field the author edits as JSON. A field is required when the object's `required` lists it and it has no default. The adapter's own messages (no design source, Q45) are "Enter a number of at least {min}.", "Enter a number of at most {max}.", "Enter a whole number." and "Enter valid JSON.". A `user` hint has no picker until 9b and renders as plain text. A schema the browser cannot rebuild with `z.fromJSONSchema` still renders; it is just never reported as invalid on the client, and the server validates on save as before.
```

**6e. `ai-tools.md`.** In the property list, replace `- `execute(input, context)`: returns `{ ok, data?, error? }`.` with itself followed by:

```
- `changesContent` (optional, default false): set it to true when the tool writes to the content. The built-in `readTarget` is false and `updateTargetFields` is true. `listAiTools` returns it (`WorkflowsAiTool.changesContent: Boolean!`); the workflow editor shows the tag "Changes content" on the tool and appends " · can change content" to the step summary when a chosen tool has it (D167, R283).
```

(check `grep -cF` of the old line prints 1.)

**6e2. `notifications.md`.** Append to the `**Choosing transports.**` paragraph (replace `it never blocks editing or saving a workflow (R192).` with the text below):

```
it never blocks editing or saving a workflow (R192). The editor lists the transports from `listNotificationTransports` as checkboxes; ids on a loaded step that are no longer listed are kept on save and not shown (D151, R272).
```

**6f. `README.md`.**

1. Replace `the workflow editor notes and the open editor bugs.` with `the workflow editor as built in phase 9a.` and `as built in phases 8a and 8b (shared review core` with `as built in phases 8a, 8b and 9a (shared review core`.
2. Replace `| `app-workflows` | Core admin UI: shared review core (phase 8a) and the workflow editor | review core tested, editor not |` with `| `app-workflows` | Core admin UI: shared review core (phase 8a) and the workflow editor (phase 9a) | review core and editor tested |`.
3. Replace `6. Admin editor code: gateways drop error `code`/`data`, `useCanUseWorkflows` is misused (always false), fire-and-forget editor saves (`app.md` §7). The review UI bugs of the first snapshot went with the old code in phase 8a.` with `6. Admin editor code (first snapshot): gateways dropped error `code`/`data`, `useCanUseWorkflows` was misused (always false), editor saves did not wait for the server. The review UI bugs went with the old code in phase 8a and the editor bugs with the old editor in phase 9a (`app.md` §7).`
4. Replace `- Admin: step editor is not type-aware; needs a step-type registry or decoratable field slots. Bar, tags, options and widgets assume human review.` with `- Admin (first snapshot): the step editor had no type-specific form; 9a builds one FormModel form per step type (D168). Bar, tags, options and widgets assumed human review until 8b.`

- [ ] **Step 7: Final greps (the proof)**

```
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -rnE "kept until 9a|until 9a-9c|until phases 9a|must move from|has no tests|not type-aware|fire-and-forget|editor not tested|9a moves it" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-110
grep -n "definitionId" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
grep -rnE "WorkflowsEditor|CmsWorkflowsEditor|WorkflowStepModel|listWorkflowNotificationTypes|IWorkflowApplication" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md | cut -c1-90
grep -n "^## D16[5-9]\." docs/.bruno/workflows/decisions.md
grep -n "D165\|D168\|D122\b" docs/.bruno/workflows/decisions.md | cut -c1-80
grep -n "D1-D169" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-70
grep -n "^## 3\.\|^## 7\.\|^## 8\.\|^## 9\." docs/.bruno/workflows/app.md
grep -n "^### 13.2\|^### 13.3" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
yarn format:check 2>&1 | tail -5
```

Expected: the first grep prints nothing; the second prints nothing (the roadmap `Parallelism` line contains `9a-9c` but not the searched phrases); the third prints nothing; the fourth prints nothing (a hit is rewritten, not filtered); the fifth prints the five headings D165-D169; the sixth prints the new headings, the D66 note's `D168` and the D92 and D122 notes; the seventh shows both files; the eighth prints the four headings `## 3. Workflow editor (9a, as built)`, `## 7. Bugs`, `## 8. Duplication and dead code`, `## 9. Open for 9b and 9c`; the ninth prints `### 13.2 Workflow editor` and `### 13.3 Request review dialog` once each; the tenth prints one number six times; `yarn format:check` is clean for the touched files (run `yarn format:fix > /dev/null 2>&1` first if it reports wrapped lines in the markdown).

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

`git status --short` must list only the docs files of this task (decisions, spec, roadmap, `app.md`, `api.md`, `integrations.md`, `automations.md`, `notifications.md`, `README.md`) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then:

```
git commit -m "docs(workflows): record phase 9a (D165-D169), spec 4.1, 10 and 13.2 and the guides as built" -m "Adds D165 (validation errors point at the step and field), D166 (workflows lists teams for the editor), D167 (the AI step editor ships with the editor), D168 (step forms per type) and D169 (colour presets are theme tokens), adds notes to D66, D92 and D122, updates spec 4.1 (automationId, error data), 7.2, 10, 13.1 and 13.2, marks roadmap row 9a built and moves the AI step editor from 9c to 9a, rewrites app.md section 3 for the new editor, and extends api.md, integrations.md, automations.md and notifications.md for the as-built phase 9a code." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. The contract's Task 23 entry lists `decisions.md` (D165-D169, notes on D66, D92, D122), spec 13.2 and 4.1 (`automationId`), roadmap rows 9a and 9c, `app.md`, `api.md`, `integrations.md`. The Step 1 grep found more guides and lines that describe the old editor or its gaps: spec 7.2, 10, 13.1 and the status line, roadmap row 7 ("must move"), `README.md` (index line, package table, bug 6, gap line), `integrations.md` sections 5 and 6 (item 12), `automations.md` and `notifications.md` (new facts the editor adds). `routing.md` (the product brief), `bugs.md`, `open-questions.md`, `infrastructure.md` and `ai-tools.md` have no statement 9a invalidates. The design brief (`2026-10-06-workflows-ui-design-brief.md`) is the source of the design copy and is not edited.
2. The spec's 4.1 `definitionId` was a spelling bug against 7.2 and the code (`automationId`); it is corrected here, not in a new decision.
3. `api.md` is a 2026-10-01 snapshot; it is extended with section 12, not refreshed, as in 8a and 8b.
4. Several as-built names in the editor section (`WorkflowEditorView`, `StepDrawer`, `useLeaveGuard`, `mapSaveError`, the renderer names, the dialog and banner folders, the step drawer presenter's file) come from the contract's Interfaces by task; the other 9a task files were written in parallel, so Step 2 checks each and a renamed one is corrected in the doc and listed in the report.
5. The `[AW]/index.tsx` sentence of `app.md` section 1 is written from Task 22 (barrel: `WorkflowsAdminApp`, `useWorkflowsPermission`, `WorkflowsPermissionsFeature`); Step 2 prints the barrel to confirm it.
6. R280's deviation (model rows carry no step count) is documented as a known limit in `app.md` section 3, not as a spec statement, because the spec's own 13.2 sub-line text is described as the design's.
7. The handoff file is not part of this task; the user decides at the end of the phase.
