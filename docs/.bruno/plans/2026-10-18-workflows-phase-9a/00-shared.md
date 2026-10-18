# Workflows Phase 9a: Admin workflow editor foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new workflow editor replaces the dead one, in the CMS (`/cms/workflows`) and the Website Builder (`/website-builder/workflows`), for viewers with the workflows `editor` permission. The CMS shows a paged, server-searched model list; the WB has the single item Pages. An admin creates a workflow for a model, adds steps by type (People, Automation, AI; unavailable types listed and disabled with their reason), edits each step in a 560px drawer built on FormModel (common fields, Notify via, the type's own fields; automation settings generated from JSON schema; the full AI step editor), reorders steps by drag or up/down, and saves explicitly. Saving validates on the client first, then maps server errors onto the step and field, and handles the conflict, deleted-while-editing, duplicate-model, blocked-delete and generic-failure cases with the design's dialogs and banners. Leaving with unsaved changes asks first. A save refreshes the review UI's workflow cache. The old editor is deleted.

**Architecture:** Eight sub-phases, bottom up.

1. **9a.1 API** (`api-workflows`, `ai-powerups`, `api-headless-cms-workflows`, `api-website-builder-workflows`): validation errors carry `{ stepId, field, workflowId }`; the shared `workflows { listTeams }` query with `memberCount`.
2. **9a.2 Admin foundations** (`app-admin`, `app-workflows`): the JSON-schema to FormModel adapter and validator; the shared searchable Picker and MultiPicker.
3. **9a.3 Editor core** (`app-workflows/src/editor`, then the review cache, then the CMS and WB gateways).
4. **9a.4 Editor model and presenter** (`app-workflows`): `WorkflowDraft` and the pure helpers; the presenter core; save and delete.
5. **9a.5 Step editor** (`app-workflows`): the common and People forms, the Automation form, the AI form, the step drawer.
6. **9a.6 Editor view** (`app-workflows`): shell and model panel; flow and step cards; type picker; dialogs; banners, toasts and the leave guard.
7. **9a.7 App glue and cleanup** (CMS and WB packages, `app-workflows`): mounting per app; deleting the old editor.
8. **9a.8 Docs.**

**Tech Stack:** as phases 8a/8b, plus `@webiny/app-admin` FormModel (`FormModelFactory`, `FormView`, `createFieldRenderer`, `AdminConfig.Form.FieldRenderer`, `field(path).setValidation`), `SortablePresenter` (`app-admin/src/presentation/sortable`, registered by `SortableFeature` in `Admin.tsx`), `useRouter().addTransitionGuard`, `useDialogs`, admin-ui `AutoComplete` / `MultiAutoComplete` (`optionRenderer`, `selectedOptionRenderer`), zod 4.4 in `app-admin` (`z.fromJSONSchema`); API side `@webiny/api-core` teams and admin users use cases.

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` 4.1, 7.1-7.2, 8, 10, 12, 13.1, 13.2. Decisions: D14, D15, D35, D37, D56, D66, D91, D92, D96, D98, D101, D108, D109, D115, D116, D120, D122, D123, D125, D129-D133, D138, D139, D151, D152, D159, D162. UI brief sections 2, 3.1, 3.2. Design (gitignored): `docs/.bruno/workflows/design/files/README.md` sections 1, 3, 4, 9, `answers.md` (QBZ-8 to 20, 40, 44 to 47, 88, 89, 93, 94, 97), `Workflow Editor.dc.html`, `Workflow Editor States.dc.html` (47 frames), `Picker.dc.html`. Exact copy with sources: `.superpowers/sdd/p9a-plan/research-spec.md` section 4, `research2-admin.md` section 5 (AI) and the list "Design strings the contract does not mention" in `contract-review-1.md`; task writers copy every string they use into the task file and stop on any string with no source. Research: `.superpowers/sdd/p9a-plan/research-*.md`, `research2-*.md`, `contract-review-1.md`. User answers: `00-answers.md` (Q41-Q44).

**Earlier rules keep applying:** phases 1a-8b, R1-R266, A1-A96, D1-D164. This plan continues with **R267, A97, D165**. Task numbers restart at 1.

## Global Constraints

**Every Global Constraint of phase 8b applies unchanged** (`docs/.bruno/plans/2026-10-17-workflows-phase-8b/00-shared.md`, which inherits 8a's): API folder layout, `yarn test` + `yarn test:os` for API tasks, never throw out of resolvers, storage keys frozen, design copy verbatim, admin permission checks are display gates, the subclass rule R237, one token per file, one named import per line, no inline object types, no wrapper helpers around dependency calls, no logic duplicated across CMS and WB, presenters own state with render-ready VMs, flag gating with root tests on and off, the pre-commit chain, the commit trailers (the user's rule: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: <CURRENT_SESSION_URL>`). Additions for 9a:

- **Editor gate:** every editor route, menu item and config query is shown only when `getWorkflowsPermissionSet(identity).editor` is true (D162). The server keeps its checks.
- **Storage:** 9a stores nothing new and changes no key. The step colour is a string the server already stores.
- **Registration:** every new DI feature is registered in `[AW]/app.tsx` (`WorkflowsAdminApp`, flag-gated) by the task that creates it, and `[AW]/app.test.tsx` asserts it with the flag on and off. Field renderers are registered by a JSX config component `WorkflowEditorConfig` (rendering `AdminConfig.Form.FieldRenderer` entries, the `app-file-manager/src/app.tsx` pattern) mounted in `WorkflowsAdminApp`; the task that adds a renderer adds its entry there.
- **Folders:** the new editor lives in `[AWE]` = `packages/app-workflows/src/editor` (not `src/review/editor`, which is the review session of 8a). `[AWET]` = `[AWE]/testing` follows R243 (ships in `dist`; pure builders have no vitest, mobx or DI imports; vitest fakes in separate files).
- **Render-ready VMs** (R234): the view gets only VMs; the `WorkflowDraft` MobX model stays inside the presenters, and step summaries and warning lines are computed in presenter VMs, not in components. The shared view receives the per-app `useCases`, `reviewUseCases` and `app` adapter as props and passes them to `presenter.init` (8a mounting pattern).
- **Copy:** design strings from the sources above; where a decision and the design differ, R269-R282 say which wins.

## Review Focus

1. **A save loses data or overwrites another admin's change** (D131, R276). Pinned by Task 10 (the loaded `savedOn` string is sent back unchanged; a conflict never stores; reload replaces the draft only after the dialog) and Task 5 (`savedOn` round-trips from the `DateTime!` field unchanged).
2. **Server errors land on the wrong step or field, or cannot be cleared** (Q41, R267, R276). Pinned by Task 1 (every validation site sets `stepId`/`field`), Task 10 (mapping to the step and field; workflow-level fields mark the name or the steps box; unmatched fields show the server text on the card) and Task 14 (field error in the drawer; editing the step clears it).
3. **A step's config is sent incomplete or with editor-only keys** (R270, R272). Pinned by Task 8 (`toInput` emits the review defaults, keeps unknown transport ids and AI tools, carries `assignment` unchanged) and Tasks 11-13 (forms produce exactly the config schema's keys).
4. **The adapter renders a field the schema cannot validate, misses a required one, or crashes on an odd schema** (R271). Pinned by Task 3 (every JSON schema type, `required`, `default`, `enum`, `ui` hints, number bounds, JSON fallback text conversion; the validator never throws).
5. **Unavailable types or automations can be added** (D122, D35, R269). Pinned by Task 8 (availability per model) and Task 17 (disabled cards with the reason).
6. **Leaving or switching loses unsaved work silently** (D92, QBZ-17, R279). Pinned by Task 9 (switching model asks; a new draft is dirty) and Task 19 (router guard dialog; `beforeunload` only while dirty).
7. **Delete removes a workflow with running reviews or lies about why it cannot** (D115, QBZ-19, R278). Pinned by Task 10 and Task 18 (blocked dialog with count, up to 5 reviews, closing sentence per `reassign`).
8. **The review UI keeps showing an old workflow after a save** (A74, R277). Pinned by Task 6 (invalidation, pending load dropped) and Task 10 (called after save and delete).
9. **Team, automation or AI lists leak data or fail silently** (Q42, R268, Q43). Pinned by Task 2 (id, name, memberCount only; editor gate; ids cap) and Task 9 (option failure banner with Try again).
10. **Editor features active without the flag or without `editor`** (R211, D162). Pinned by every registering task's `app.test.tsx` case and Tasks 20, 21 (root tests flag on/off; editor off hides menu and route).

## Rulings

- R267. **Validation error data** (Q41). `WorkflowValidationError` (`[AWF]/domain/workflow/errors.ts`) takes an optional second constructor argument `WorkflowValidationErrorData { stepId: string | null; field: string | null; workflowId: string | null }`, every key defaulting to `null`, exposed as `data`. Sites in the editor's save path set it. Workflow-level (`stepId` null): `field` `name`, `models` or `steps` (also `Every step needs an ID.`, field `steps`). Step-level: `stepId` and `field` one of `id` (duplicate step id), `title`, `type`, `color`, `notifications`, `config.teams`, `config.assignment.rules`, `config.automationId`, `config.settings` or `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools`, or `config.<zod issue path>` for a review config issue. Settings paths come from a new sibling of `parseAutomationSettings`, `parseAutomationSettingsIssue(schema, settings): Result<unknown, AutomationSettingsIssue>` with `AutomationSettingsIssue { path: string; message: string }`; the old function and its callers (`AutomationStepRunner.ts`, tests) stay as they are. The duplicate-model error (same code) sets `field: "models"` and `workflowId`. The CMS and WB before-create/update handlers and the app-mismatch guards set `field: "models"`. Messages and codes are unchanged. Site map: `research2-api.md` A.
- R268. **`listTeams`** (Q42). Shared query `workflows { listTeams(search: String, ids: [String!], limit: Int): WorkflowsTeamListResponse! }`, data `WorkflowsTeamListResult { teams: [WorkflowsTeamSummary!]!, missingIds: [String!]! }` (mirroring `WorkflowsUserListResult`), `WorkflowsTeamSummary { id: ID! name: String! memberCount: Int! }` (new; `WorkflowsTeam` stays). Gated on `editor`. Built like `ListWorkflowUsers` in `[AWF]/features/config/`: only the team lookup (api-core `ListTeamsUseCase`) and the member-count scan (one `ListUsersUseCase` call per request, users carry their teams; a planner extension of Q42 for `memberCount`, exposing only a number) run inside `identityContext.withoutAuthorization`. `search` is a case-insensitive name filter in memory; `ids` returns those teams with unknown ones in `missingIds` and refuses more than 200 ids with the Validation error `Too many team ids.` (the `listUsers` rule); `limit` default 50, max 200 (constants next to the `*_USER_LIST_LIMIT` ones); sorted by name. Exposes only `id`, `name`, `memberCount`.
- R269. **Step types in the editor** (D122, D35, QBZ-97). Every type from `listStepTypes` is listed in the order returned. A type is addable only when `available` and, for `automation`, when at least one definition covers the workflow's model (`matchesAutomationScope`: `*`, `<app>.*`, or the exact namespace, mirrored in a pure client function). Disabled reasons use the design copy: AI `Requires the AI Power-Ups licence.`; Automation `No automations are available for this model.` (CMS) / `No automations are available for pages.` (WB); any other unavailable type shows the server's `unavailableReason`. UI names: `review` "People", `automation` "Automation", `ai` "AI" (D98); unknown types use the server `title`. The type cannot be changed later (D91).
- R270. **One FormModel form per step type, no tabs in 9a** (D56, D66). The drawer builds one form per step: the common fields (Title, Colour, Description, Notify via) and the type's config fields, in a single body (the Assignment and Test routing tabs, the tab error dots and "This step has an error on the {tab} tab." arrive with 9b). People config `{ teams, assignment }`: 9a edits `teams` and carries `assignment` unchanged; a new step gets `{ strategy: "none", allowManualPick: false, rules: [] }`. Automation `{ automationId, settings }`. AI `{ instructions, model, tools }`. A step of an unknown type is shown read-only with its title and type and saved unchanged. The People hint in 9a is only its first sentence, `Members of these teams can review.` (the two sentences about routing rules and the Assignment tab return with 9b).
- R271. **JSON-schema to FormModel adapter** (D66). In `@webiny/app-admin` (`src/features/formModel/jsonSchema/`): `buildFieldsFromJsonSchema(schema: JsonSchema, registry: IFieldBuilderRegistry, options: JsonSchemaFieldOptions): Record<string, IFieldBuilder>` maps `string` to `text` (`enum` to the `select` renderer, `ui: "textarea"` to `textarea`, other `ui` hints to `options.uiRenderers[hint]`, else plain text), `number`/`integer` to `number` with bounds and integer through `.schema(z.number()...)`, `boolean` to `boolean` (`switch`), `object` to `object().fields(...)`, an array of strings to a text list (`tags`), an array of objects to `object().list()`, anything else to a JSON text field (`codeEditor`) whose value is the JSON text: `.schema()` checks it parses, and `jsonSchemaValueToFormData(schema, value)` / `formDataToJsonSchemaValue(schema, data)` convert between stored values and form data (stringify on load, parse on read); `title` to label, `description` to help, `default` to `defaultValue`; the object's `required` to `required()` unless the field has a `default`. `createJsonSchemaValidator(schema: JsonSchema): JsonSchemaValidator` rebuilds a zod schema with `z.fromJSONSchema`, returns `{ validate(value: unknown): JsonSchemaValidationResult }` (`{ valid: boolean; issues: JsonSchemaIssue[] }`, `JsonSchemaIssue { path: string; message: string }`) and never throws: a schema `z.fromJSONSchema` rejects yields a validator that always reports valid. No secret fields (D67 superseded). 9a passes `uiRenderers: { team: <the teams picker renderer name> }`; a `user` hint has no 9a picker and falls back to plain text (9b adds it).
- R272. **Notify via** (D96, D129, D151, QBZ-45, QBZ-88). Checkboxes, one per transport from `listNotificationTransports` (title and optional description). A new People step starts with `e-mail` ticked when that transport exists; other types start with none. Ids on a loaded step that are not listed are kept on save and not shown. With no transports: `Only in-app notifications are available. No other channels are configured.` The hint `In-app notifications are always sent. Who gets notified is set automatically from the step.` shows in both cases.
- R273. **Colour** (UI-2). `[AWE]/domain/stepColours.ts` lists ten presets stored as the prototype's CSS variable strings, in order: Orange `var(--color-primary-500)`, Rust `var(--color-primary-800)`, Amber `var(--color-warning-600)`, Olive `var(--color-warning-800)`, Teal `var(--color-success-500)`, Green `var(--color-success-800)`, Red `var(--color-destructive-500)`, Maroon `var(--color-destructive-700)`, Gray `var(--color-neutral-500)`, Ink `var(--color-neutral-900)` (labels from the prototype, `Workflow Editor.dc.html:505`). A custom colour is `#RRGGBB`; an invalid hex blocks Save with `Enter a hex colour, e.g. #3B6FD4.` on the Colour field and the step strip, and an unfinished hex stays in the field without reaching the draft. A new step takes Orange. A loaded colour that is neither is kept; a hex shows as custom, anything else as no selection.
- R274. **Automation step** (D14, D35, D37, QBZ-13, QBZ-14, QBZ-40). Radio cards of the definitions covering the model: name, and the settings schema's top-level `description` when present (definitions have no description field). A null `settingsSchema` means no settings form. Settings come from the adapter. Switching to another automation with settings entered asks `Switch to “{automation}”?` / `The settings for {current} are cleared. The change applies when you save the workflow.` with Cancel / Switch automation; without settings it switches at once. Card warning `The automation “{name}” no longer exists.` when the stored `automationId` is not listed; `Saved settings no longer validate: {error}` only when the stored settings fail `createJsonSchemaValidator` and the admin has not changed them in this session (QBZ-13).
- R275. **AI step** (Q44, D101, D109, D138, D139, QBZ-8, QBZ-89). The AI editor exists only when the `ai` row is `available` and has a `configSchema` (then `listAiModels` exists; `research2-api.md` C); otherwise AI cards are disabled and an existing AI step is read-only with the licence warnings (QBZ-47: move and delete stay enabled). Instructions (textarea, required, `Enter instructions for the AI.`), Model (single Picker over `listAiModels`, required, `Choose an AI model.`; a new step has none; a stored model not listed shows the retired card and warning, QBZ-8, not a save blocker), Tools (checkboxes over `listAiTools`; stored tool names not listed are kept and not shown; a server error on `config.tools` shows under the tools list). Every AI string is the design's (`research2-admin.md` 5).
- R276. **Save** (D92, D108, D123, D131, QBZ-10, QBZ-11, QBZ-12, QBZ-18, QBZ-44). Save is enabled only when dirty; a draft made with Create workflow is dirty from the start. Client validation first (QBZ-12: `Enter a workflow name.`, `Add at least one step.`, `Enter a title for this step.`, `Choose at least one reviewing team.`, `{Label} is required.` for required automation settings, `Enter instructions for the AI.`, `Choose an AI model.`, the hex rule of R273); on failure (and on a server error with a `stepId`) the steps and fields are marked, the first failing card scrolls into view, and the toast is `Fix the highlighted steps before saving.` (or `Fix the highlighted fields before saving.` when only the name or the step count is wrong). Then the store mutation with the loaded `savedOn` string (null for a new workflow or Save as new). Results:
  - success: the returned workflow becomes the baseline and updates the open model row (bound id, name); toast `Workflow saved`;
  - `Validation` with a `stepId`: that step's card and field are marked (a `field` with no form field shows the server message as the card strip and at the top of the drawer, until the step is edited); toast `Could not save. Check the highlighted step.`;
  - `Validation` with a `workflowId`: the presenter reads the other workflow's name with `getWorkflow(workflowId)` (fallback: the model row's bound workflow name, then the server message) and shows the banner `Could not save the workflow — {Model} already has a workflow: “{name}”.` + ` A model can have one workflow.` (WB, QBZ-44: `Could not save the workflow — Pages already have a workflow: “{name}”. Pages can have one workflow.`) with Reload (`Reload workflow?` / `Your unsaved draft for {model} is lost, and the existing workflow “{name}” opens.`, Keep editing / Reload), which loads that workflow;
  - `Validation` with `field` `name` or `steps` and no `stepId`: the name input or the "No steps yet" box is marked and the banner `Could not save the workflow — {server message}` shows;
  - any other `Validation`: the banner `Could not save the workflow — {server message}` (Q43);
  - `Conflict`: `Someone else changed this workflow` (`{name} saved a newer version of “{workflow}” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.`, name from `savedBy.displayName`, else `Someone`) with Keep editing / Reload workflow; reload toast `Loaded the latest version`;
  - `NotFound`: `This workflow was deleted` / `“{workflow}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for {model}, or discard them.` (QBZ-94, superseding D123's text) with Discard changes (back to the model's empty state) / Save as new workflow (same id, `savedOn` null), toast `Saved as a new workflow`;
  - a transport error: the QBZ-10 banner `Could not save the workflow` / `The server did not respond, so nothing was saved. Your changes are kept.` with Try again (toast `Retrying…`) and dismiss.
  The draft stays dirty on every failure.
- R277. **Review cache** (A74). `IReviewReadUseCases` gains `invalidateWorkflows(): void`, which clears the shared `ReviewUseCases` cached workflow list (its cached promise, so a pending load is dropped too); the editor calls the app's review use cases after a successful save and delete.
- R278. **Delete** (D115, QBZ-19). `Delete workflow?` / `“{name}” will be removed from {Model}. New revisions can then be published without a review. Finished reviews keep their history.` with Cancel / Delete workflow; toast `Workflow deleted`; the open row loses its bound workflow. On `HasActiveReviews`: `This workflow can't be deleted yet`, the count text (`1 review using “{name}” is in progress.` / `{n} reviews using “{name}” are in progress.`), the listed reviews (`{title}`, `Step {n} of {N} · {step}`, each linked through the app's existing review content adapter, `IReviewContentAdapter.getContentUrl`, with `ReviewContentRef { namespace: review.model, targetId: review.targetId, targetRevisionId: review.targetRevisionId, contentTypeId: null }`), the closing sentence by the viewer's `reassign` permission (QBZ-19), and only Close. Delete step: `Delete step?` with the design body, removed from the draft.
- R279. **Leaving** (D92, QBZ-17). Switching the model with a dirty draft asks `Discard unsaved changes?` (`You have unsaved changes to “{name}”. If you leave this workflow now, they are lost.`, `this workflow` when unnamed) with Keep editing / Discard changes. Leaving the editor route through the router does the same through `useRouter().addTransitionGuard` and `useDialogs` (the `ContentModelEditor.tsx` pattern). While dirty, `beforeunload` raises the browser's own prompt.
- R280. **Model list** (D116, QBZ-20). CMS: `listCmsEntryWorkflowModels` 20 per page, server search (debounced 250 ms; a new search restarts at the first page), `Load more` while `hasMoreItems`, empty `No models match “{q}”.`. Each row: the model icon (`WorkflowEditorAppAdapter.renderModelIcon`, after the adapter's `init()` filled the admin `ModelsCache`), the name, the sub line, the bound indicator and the unsaved dot for the open model. The sub line is `{n} steps` for the open model's loaded workflow, the bound workflow's name for other bound rows (deviation: rows carry no step count, QBZ-20 forbids counts per row), `No workflow` otherwise. WB: one row `Pages`, panel label `WEBSITE BUILDER`, no search.
- R281. **Copy without a design source** (Q43): options load failure `Could not load the step options.` + `Try again`; `Someone`; the D131 conflict text with no time; `Could not save the workflow — {server message}`; unknown transport ids kept silently.
- R282. **Shared Picker** (UI-3). `WorkflowPicker` (single) and `WorkflowMultiPicker` (chips) in `[AW]/components/picker/` over admin-ui `AutoComplete` / `MultiAutoComplete`, props `options` (search results) and `selected` (the chosen items with labels, so a chip or the value keeps its label when a search narrows the list), a search callback, at most 50 visible options followed by `More matches. Keep typing to narrow the list.`, `Nothing matches “{q}”.` when empty, an unknown selected id as `Unknown item` with `This item no longer exists.`, and a per-option warning rendered through `optionRenderer` from the option's `item` (multi chips through `selectedOptionRenderer`; the single picker shows the selected option's warning under the input, A100) (teams with `memberCount` 0 show `This team has no members`). 9a uses it for teams and AI models; 9b reuses it for users and folders.

## Assumptions

- A97. `app-admin` resolves zod 4.4 with `z.fromJSONSchema` (verified by contract review 1).
- A98. `SortableFeature` is registered in the admin container (`Admin.tsx:55`, verified).
- A99. api-core `ListUsersUseCase` (admin users, each with its teams) and `ListTeamsUseCase` exist (contract review 2).
- A100. `AutoCompletePrimitive` has `optionRenderer` but no `selectedOptionRenderer` (contract review 2): the single picker renders the selected option's warning under the input.

## Decisions

Recorded by Task 23 (no SEC ids).

- **D165. Validation errors point at the step and field.** `Workflows/Workflow/Validation` carries `{ stepId, field, workflowId }`; the duplicate-model error names the bound workflow. Refines D92. Source: Q41, R267.
- **D166. Workflows lists teams for the editor.** `workflows.listTeams` returns id, name and member count, gated on `editor`. Source: Q42, R268.
- **D167. The AI step editor ships with the editor.** Phase 9a builds the AI step editor; 9c keeps the settings page and the permission UI. Source: Q44.
- **D168. Step forms per type.** The drawer builds one FormModel form per step type; automation settings come from the JSON-schema adapter in `app-admin`. Refines D66 (no dynamic zone). Source: R270, R271.
- **D169. Colour presets are theme tokens.** A preset colour is stored as its CSS variable string, a custom colour as hex. Source: R273.

## Task order

1. **9a.1:** Task 1, Task 2 (independent).
2. **9a.2:** Task 3, Task 4 (independent).
3. **9a.3:** Task 5 -> Task 6 -> Task 7.
4. **9a.4:** Task 8 -> Task 9 -> Task 10.
5. **9a.5:** Task 11 -> Task 12 -> Task 13 -> Task 14.
6. **9a.6:** Task 15 -> Task 16 -> Task 17 -> Task 18 -> Task 19.
7. **9a.7:** Task 20 -> Task 21 -> Task 22.
8. **9a.8:** Task 23.

Dependencies: 9a.3 needs 9a.1's SDL for its documents. 9a.4 needs 9a.3. 9a.5 needs 9a.2 and 9a.4. 9a.6 needs 9a.5. 9a.7 needs 9a.6. 9a.8 needs everything.

## Sub-phases

| Sub-phase | Folder | Tasks |
|---|---|---|
| 9a.1 API | `9a.1-api/` | 1, 2 |
| 9a.2 Admin foundations | `9a.2-admin-foundations/` | 3, 4 |
| 9a.3 Editor core | `9a.3-editor-core/` | 5, 6, 7 |
| 9a.4 Editor model and presenter | `9a.4-editor-presenter/` | 8, 9, 10 |
| 9a.5 Step editor | `9a.5-step-editor/` | 11, 12, 13, 14 |
| 9a.6 Editor view | `9a.6-editor-view/` | 15, 16, 17, 18, 19 |
| 9a.7 App glue and cleanup | `9a.7-app-glue-cleanup/` | 20, 21, 22 |
| 9a.8 Docs | `9a.8-docs/` | 23 |

## Not in this phase

9b: the People step's Assignment and Test routing tabs (strategy, manual pick, routing rules, rule inspector, tab error dots), user and folder pickers, saved-reference resolution (D117), rule warnings. 9c: the workflow settings page (exclusions) and the workflows permission UI. Several workflows per model. Secret settings. Model-delete dialog changes. Marking the design boards implemented (`/design-pull mark` after 9c).

## Interfaces by task

Shorthands as 8b: `[AWF]` api-workflows/src, `[CMSA]`, `[WBA]`, `[AW]` app-workflows/src, `[AWT]` app-workflows/src/review/testing, `[CMSW]`, `[WBW]`; `[ADM]` = `packages/app-admin/src`; `[AWE]` = `packages/app-workflows/src/editor`; `[AWET]` = `[AWE]/testing`. Research cites existing files with lines; writers re-read every file they change.

### Task 1: Validation error data

- **Files:** `[AWF]/domain/workflow/errors.ts`; the `fail` helpers and sites in `[AWF]/domain/workflow/WorkflowValidator.ts`, `[AWF]/features/stepTypes/ReviewStepType/ReviewStepType.ts`, `[AWF]/features/stepTypes/AutomationStepType/AutomationStepType.ts`, `[AWF]/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`; the new `parseAutomationSettingsIssue` next to `parseAutomationSettings` (R267); `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts`; the CMS before-create/update handlers and app-mismatch guard in `[CMSA]`, the WB guard in `[WBA]`. Tests: new `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts` (one case per site class: name, models, steps, step id, title, review teams, review rules, review zod path, automation id, automation settings path, unknown type, duplicate model with `workflowId`, user-target membership), `parseAutomationSettingsIssue` tests, an AI case in `ai-powerups`, a CMS and a WB GraphQL case asserting `error.data`.
- **Produces:** `WorkflowValidationErrorData`, `parseAutomationSettingsIssue`, `AutomationSettingsIssue`.

### Task 2: `workflows.listTeams`

- **Files:** `[AWF]/features/config/ListWorkflowTeams/{abstractions.ts, ListWorkflowTeamsUseCase.ts, feature.ts, index.ts}` (mirror `[AWF]/features/config/ListWorkflowUsers/`), constants, `[AWF]/graphql/WorkflowsSchemaFactory.ts`, `[AWF]/WorkflowsFeature.ts`. Tests `packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts` with `__tests__/__helpers/FakeListTeams.ts` (and a fake users list), mirroring the `listUsers` tests (search, ids + missingIds, more than 200 ids, limit clamp, sort, memberCount, not editor -> `Workflows/NotAuthorized`, only id/name/memberCount), `workflowsSchema.test.ts`, `registration.test.ts`.
- **Produces:** R268.

### Task 3: JSON-schema adapter and validator (`app-admin`)

- **Files:** `[ADM]/features/formModel/jsonSchema/{JsonSchema.ts, JsonSchemaFieldOptions.ts, buildFieldsFromJsonSchema.ts, jsonSchemaValueToFormData.ts, formDataToJsonSchemaValue.ts, createJsonSchemaValidator.ts}` with co-located tests; export them from `[ADM]/index.ts` (FormModel section).
- **Produces:** R271 names.

### Task 4: Shared Picker

- **Files:** `[AW]/components/picker/{PickerOption.ts, limitPickerOptions.ts, WorkflowPicker.tsx, WorkflowMultiPicker.tsx}` with tests.
- **Produces:** `PickerOption { id: string; label: string; description: string | null; warning: string | null }`; `WorkflowPicker` props `{ value: string | null; selected: PickerOption | null; options: PickerOption[]; onSearch(search: string): void; onChange(id: string | null): void; placeholder: string; disabled: boolean; error: string | null }`; `WorkflowMultiPicker` props `{ values: string[]; selected: PickerOption[]; options: PickerOption[]; onSearch(search: string): void; onChange(ids: string[]): void; placeholder: string; disabled: boolean; error: string | null }`; `limitPickerOptions(options: PickerOption[]): LimitedPickerOptions` (`{ options: PickerOption[]; hasMore: boolean }`, cap 50).

### Task 5: Editor core

- **Files (`[AWE]`):** `domain/types.ts` (`EditorWorkflow`, `EditorStep`, `EditorStepType`, `AutomationDefinition`, `NotificationTransport`, `WorkflowTeamSummary`, `AiModel`, `AiTool`, `WorkflowModelRow`, `WorkflowModelPage`, `WorkflowTeamList`), `domain/WorkflowErrorCode.ts` (`NotFound`, `Conflict`, `Validation`, `Persistence`, `HasActiveReviews`, `NotAuthorized`), `gateway/{dto.ts, editorFields.ts (EDITOR_WORKFLOW_FIELDS incl. `notifications { id }`, `savedOn`, `createdOn`, `savedBy`, `createdBy`), mapEditorWorkflow.ts, IWorkflowEditorGateway.ts, IWorkflowConfigGateway.ts, WorkflowConfigGateway.ts (token), WorkflowConfigGatewayImpl.ts}` (the config gateway is one shared implementation over `MainGraphQLClient` on the `workflows` root, bound once; `listAiModels` runs only when called), `useCases/{IWorkflowEditorUseCases.ts, WorkflowEditorUseCases.ts (plain shared class, R237), IWorkflowConfigUseCases.ts, WorkflowConfigUseCases.ts (token), WorkflowConfigUseCasesImpl.ts}`, `feature.ts` (`WorkflowEditorServicesFeature`), `[AWET]` builders and fakes (R243); `[AW]/app.tsx` and `app.test.tsx`. Tests: mappers (`savedOn` string unchanged), both use-case classes (envelope error -> `GraphQLOperationError` with code and data), the config gateway documents.
- **Produces:** `IWorkflowEditorGateway { listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>; getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>; storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>; deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> }`, `ListWorkflowModelsParams { search: string; limit: number; after: string | null }`, `StoreWorkflowParams { data: EditorWorkflowInput; savedOn: string | null }`; `IWorkflowEditorUseCases` (same four, domain types, throws `GraphQLOperationError`); `IWorkflowConfigUseCases { listStepTypes(); listAutomationDefinitions(); listNotificationTransports(); listTeams(params: ListTeamsParams); listAiModels(); listAiTools() }`, `ListTeamsParams { search: string | null; ids: string[] | null; limit: number | null }`.

### Task 5b additions (part of Task 5): editor toasts

- **Files:** `[AWE]/toasts/{WorkflowEditorToasts.ts (token), WorkflowEditorToastsImpl.ts}` over the admin `Notifications` with the D125 options (bottom right, 8 s, dismissible), registered by `WorkflowEditorServicesFeature`.
- **Produces:** `IWorkflowEditorToasts { success(title: string): void; error(title: string): void; info(title: string): void }`. Presenters (Tasks 9, 10, 14) call it; `Retrying…` is `info`. The 8a `ReviewToasts` stays review-only.

### Task 6: Review cache invalidation

- **Files:** `[AW]/review/useCases/{IReviewReadUseCases.ts, ReviewUseCases.ts}`, `[AWT]/fakeReviewUseCases.ts`, test doubles in the CMS and WB packages that implement the interface. Tests: invalidation clears; the next read reloads.
- **Produces:** `invalidateWorkflows(): void` (R277).

### Task 7: CMS and WB editor gateways

- **Files:** `[CMSW]/features/editorGateway/{CmsWorkflowEditorGateway.ts, CmsWorkflowEditorGatewayImpl.ts, CmsWorkflowEditorUseCases.ts, CmsWorkflowEditorUseCasesImpl.ts (subclass), feature.ts, graphql/{listCmsEntryWorkflowModels, getCmsEntryWorkflow, storeCmsEntryWorkflow, deleteCmsEntryWorkflow}.ts}` registered from the CMS root; WB mirror `[WBW]/features/editorGateway/` whose `listModels` returns the single `wb.page` row (`Pages`; its bound workflow from `listWebsiteBuilderPageWorkflows`). Tests per gateway, the two-subclass test, root tests flag on and off.

### Task 8: `WorkflowDraft` and pure helpers

- **Files (`[AWE]`):** `domain/stepColours.ts` (R273), `model/{WorkflowDraft.ts (MobX: name, steps, baseline (null for a new draft, then dirty), isDirty, setName, addStep(index, step), updateStep(stepId, patch), moveStep(from, to), removeStep(stepId), toInput(): EditorWorkflowInput, reset(workflow: EditorWorkflow | null)), createNewStep.ts, validateWorkflowDraft.ts (R276 -> WorkflowDraftErrors), getStepTypeOptions.ts (R269), matchesAutomationScope.ts, getStepSummary.ts, getStepWarnings.ts}` with tests. Summary lines: People `{Teams joined with +}` (9a, no strategy part), Automation `{Automation}`, AI `{Model} · n tool(s)[ · can change content]` / `No model chosen · 0 tools`; warnings per R272-R275 and the design (`{Team} has no members.`, automation missing, stale settings, retired model, licence missing).

### Task 9: `WorkflowEditorPresenter` core

- **Files (`[AWE]/presentation/editor`):** `abstractions.ts` (token, `WorkflowEditorInitParams { useCases: IWorkflowEditorUseCases; reviewUseCases: IReviewReadUseCases; app: WorkflowEditorAppAdapter }`, VM), `WorkflowEditorPresenter.ts`, `feature.ts`; `[AWE]/WorkflowEditorAppAdapter.ts` (`{ appKind: "cms" | "wb"; panelLabel: string; appliesToLabel: string; init(): Promise<void>; renderModelIcon(modelId: string): React.ReactNode; contentAdapter: IReviewContentAdapter }`; `app-workflows` has no icon library, so the app renders the icon); `app.tsx`/`app.test.tsx`. Behaviour: init (adapter init, options load with the R281 banner and retry), model list (search debounced 250 ms, load more, select), load the bound workflow (`getWorkflow`), resolve step team ids with one `listTeams({ ids })` into a team map, create a draft (`{Model} review`, dirty), switch model with a dirty draft asks (R279), VM with summaries and warnings.

### Task 10: Save and delete

- **Files:** `[AWE]/presentation/editor/{mapSaveError.ts, the presenter's save, reload, saveAsNew, delete methods}` with tests for every R276 and R278 branch, the row update, and the `invalidateWorkflows` calls.

### Task 11: Common and People step forms

- **Files (`[AWE]/presentation/stepForm`):** `StepFormOptionsContext.ts` (a React context the drawer provides with render-ready option VMs: teams search results and the selected team summaries, transports, automations, AI models and tools, each with `loading`, `failed` and a `retry` callback; renderers read it, the presenter owns the data), the `declare module` augmentation of `IFieldRendererRegistry` for the new renderer names, `buildCommonFields.ts`, `buildPeopleStepForm.ts`, renderers `renderers/{StepColourRenderer, TeamsPickerRenderer, TransportCheckboxesRenderer}.tsx`, `[AWE]/WorkflowEditorConfig.tsx` (renderer entries) mounted in `app.tsx`; tests.

### Task 12: Automation step form

- **Files:** `buildAutomationStepForm.ts` (adapter, R274), `renderers/AutomationCardsRenderer.tsx`, the switch-automation confirmation; tests.

### Task 13: AI step form

- **Files:** `buildAiStepForm.ts`, `renderers/{AiModelPickerRenderer, AiToolsRenderer}.tsx`; tests (empty, failed, no model, retired model, unknown tools kept, licence read-only).

### Task 14: Step drawer

- **Files (`[AWE]/presentation/stepDrawer`):** presenter (open/close, form per type, server error on a field or at the top, Done applies to the draft, read-only states), `StepDrawer.tsx` (560px, header `{Type} step · the type can't be changed`, footer `Edits stay in this workflow until you save it.` + Done), `feature.ts`, `app.tsx`; tests.

### Task 15: Editor shell and model panel

- **Files (`[AWE]/presentation/editor/components`):** `WorkflowEditorView.tsx`, `ModelPanel.tsx`, `EditorHeader.tsx`, the loading, load-error, no-permission and no-workflow states; tests.

### Task 16: Flow and step cards

- **Files:** `WorkflowFlow.tsx` (Draft card, numbered cards, `+` between cards, Published card, `No steps yet` + Add step), `StepCard.tsx` (summary, type tag, warnings, error strip, up/down, edit, delete, drag through `SortablePresenter`); tests.

### Task 17: Step type picker

- **Files:** `StepTypePicker.tsx` (modal, three cards, disabled reasons, inserts at the chosen position); tests.

### Task 18: Dialogs

- **Files:** `components/dialogs/*` (switch model, conflict, deleted, delete workflow, blocked delete, delete step, duplicate reload); the presenters expose `vm.dialog: WorkflowEditorDialogVm | null` (a `kind` plus its render-ready texts and button states, set by Tasks 9, 10 and 14 and closed through presenter methods), and the view renders one dialog component per kind; tests.

### Task 19: Banners, toasts, leave guard

- **Files:** `components/banners/*` (duplicate, transport failure, options failure), the toasts through the 8a toast stack (`[AW]/review/toasts`, D125), `useLeaveGuard.ts` (router guard + `beforeunload`); tests.

### Task 20: CMS mounting

- **Files:** `[CMSW]` route and menu for `/cms/workflows` over the shared editor view (editor gate), `CmsWorkflowEditorAppAdapter` (`init` lists models once into `ModelsCache`; `renderModelIcon` through `normalizeIcon` and the CMS icon component), registration; `index.test.tsx` flag on/off and editor off.

### Task 21: WB mounting

- **Files:** `[WBW]` route and menu for `/website-builder/workflows` (editor gate added to the menu), the WB app adapter (`init` no-op); tests.

### Task 22: Delete the old editor

- **Files:** in `app-workflows`: `presentation/workflowsEditor/**`, `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes}/**`, `features/{feature.ts,graphqlFields.ts}`, `domain/{index.ts,WorkflowModel.ts,WorkflowStepModel.ts,abstractions/**}` (keep `domain/permissionsSchema.ts`, the permission files and `hooks/canUseWorkflows.ts` while used), the old `types.ts` entries (keep `IWorkflowsSecurityPermission`), the old exports in `[AW]/index.tsx` and registrations in `app.tsx` (grep the repo for `IWorkflowApplication`, `Components.Admin.WorkflowsEditor`, `useCanUseWorkflows` first; delete an export only when nothing else uses it); CMS: `Routes/CmsWorkflowsEditor.tsx`, `presentation/CmsWorkflowsEditorView.tsx`, `presentation/cmsWorkflowsEditor/**`; WB: `Components/PageWorkflows/**`. Update `app.cleanup.test.tsx` (KEPT_PATHS, the feature-name case), the CMS `index.test.tsx`, `index.editor.test.tsx`, `index.lists.test.tsx`, `features/trash/feature.test.tsx`, `index.cleanup.test.tsx`, and the WB cleanup and wiring tests.

### Task 23: Docs

- **Files:** `decisions.md` (D165-D169, notes on D66, D92, D122), spec 13.2 and 4.1 (`automationId`), roadmap rows 9a (Built) and 9c (AI editor moved to 9a), `app.md`, `api.md`, `integrations.md`. No SEC ids.
