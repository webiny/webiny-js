# Workflows Phase 9a: Admin workflow editor foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new workflow editor replaces the dead one, in the CMS (`/cms/workflows`) and the Website Builder (`/website-builder/workflows`), for viewers with the workflows `editor` permission. The CMS shows a paged, server-searched model list; the WB has the single item Pages. An admin creates a workflow for a model, adds steps by type (People, Automation, AI; unavailable types listed and disabled with their reason), edits each step in a 560px drawer built on FormModel (common fields, Notify via, the type's own fields; automation settings generated from JSON schema; the full AI step editor), reorders steps by drag or up/down, and saves explicitly. Saving validates on the client first, then maps server errors onto the step and field, and handles the conflict, deleted-while-editing, duplicate-model, blocked-delete and generic-failure cases with the design's dialogs and banners. Leaving with unsaved changes asks first. A save refreshes the review UI's workflow cache. The old editor is deleted.

**Architecture:** Eight sub-phases, bottom up.

1. **9a.1 API** (`api-workflows`, `ai-powerups`, `api-headless-cms-workflows`, `api-website-builder-workflows`): validation errors carry `{ stepId, field }` and the duplicate-model error `{ workflowId }`; the shared `workflows { listTeams }` query with `memberCount`.
2. **9a.2 Admin foundations** (`app-admin`, `app-workflows`): the JSON-schema to FormModel adapter and validator; the shared searchable Picker and MultiPicker.
3. **9a.3 Editor core** (`app-workflows/src/editor`, then the CMS and WB gateways): domain, DTOs, fragments, mappers, error codes, the per-app editor gateway and the shared config gateway, the use cases, the review-cache invalidation.
4. **9a.4 Editor model and presenter** (`app-workflows`): the `WorkflowDraft` model, client validation, summaries and warnings; the `WorkflowEditorPresenter`.
5. **9a.5 Step editor** (`app-workflows`): the step forms per type, their field renderers, the AI step form, the step drawer presenter and view.
6. **9a.6 Editor view** (`app-workflows`): the layout, model panel, header, flow, step cards, type picker; the dialogs, banners and toasts.
7. **9a.7 App glue and cleanup** (CMS and WB packages, `app-workflows`): mounting per app; deleting the old editor.
8. **9a.8 Docs.**

**Tech Stack:** as phase 8a/8b, plus `@webiny/app-admin` FormModel (`FormModelFactory`, `FormView`, `createFieldRenderer`, `layout.tabs()`), `SortablePresenter` (`app-admin/src/presentation/sortable`, pragmatic drag and drop), `useRouter().addTransitionGuard`, `useDialogs`, zod 4 (`z.fromJSONSchema`); API side `@webiny/api-core` teams and admin users use cases.

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` 4.1, 7.1-7.2, 8, 10, 12, 13.1, 13.2. Decisions: D14, D15, D35, D37, D56, D66, D91, D92, D96, D98, D101, D108, D109, D115, D116, D120, D122, D123, D125, D129-D133, D138, D139, D151, D152, D159, D162. UI brief sections 2, 3.1, 3.2. Design (gitignored): `docs/.bruno/workflows/design/files/README.md` sections 1, 3, 4, 9, `answers.md` (QBZ-8 to 20, 40, 44 to 47, 88, 89, 93, 94, 97), `Workflow Editor.dc.html` and `Workflow Editor States.dc.html` (47 frames), `Picker.dc.html`. Exact copy with sources: `.superpowers/sdd/p9a-plan/research-spec.md` sections 4.1-4.3 and `research2-admin.md` section 5 (AI); task writers copy every string they use into the task file. Research: `.superpowers/sdd/p9a-plan/research-*.md`, `research2-*.md`. User answers: `00-answers.md` (Q41-Q44).

**Earlier rules keep applying:** phases 1a-8b, R1-R266, A1-A96, D1-D164. This plan continues with **R267, A97, D165**. Task numbers restart at 1.

## Global Constraints

**Every Global Constraint of phase 8b applies unchanged** (`docs/.bruno/plans/2026-10-17-workflows-phase-8b/00-shared.md`, which inherits 8a's): API folder layout, `yarn test` + `yarn test:os` for API tasks, never throw out of resolvers, storage keys frozen, design copy verbatim, admin permission checks are display gates, the subclass rule R237, one token per file, one named import per line, no inline object types, no wrapper helpers around dependency calls, no logic duplicated across CMS and WB, presenters own state with render-ready VMs, flag gating with root tests on and off, the pre-commit chain, commit trailers (`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: <CURRENT_SESSION_URL>`). Additions for 9a:

- **Editor gate:** every editor route, menu item and config query is shown only when `getWorkflowsPermissionSet(identity).editor` is true (D162). The server keeps its checks.
- **Storage:** 9a stores nothing new and changes no key. The step colour is a string the server already stores.
- **Design copy:** strings from `research-spec.md` 4 and `research2-admin.md` 5, the D-numbered decisions, and Q43 (R281). Where a decision and the design differ, R269-R275 say which wins.
- **Deep imports** from `@webiny/app-admin` FormModel abstractions; any new export the adapter needs is added to `app-admin`'s existing barrel for FormModel (`src/index.ts` FormModel section) and nowhere else.

## Review Focus

1. **A save loses data or overwrites another admin's change** (D131, R276). Pinned by Task 8 (the loaded `savedOn` string is sent back unchanged; a conflict never stores; reload replaces the draft only after the dialog) and Task 5 (the store document sends `savedOn`).
2. **Server errors land on the wrong step or field** (Q41, R267). Pinned by Task 1 (every validation site sets `stepId`/`field`), Task 8 (mapping to the step and field, tab dot, banner for workflow-level) and Task 11 (drawer field error and "This step has an error on the {tab} tab.").
3. **A step's config is sent incomplete or with editor-only keys** (R270, R272). Pinned by Task 7 (`toInput` emits the review defaults, keeps unknown transport ids, drops nothing it did not load) and Tasks 9, 10 (forms produce exactly the config schema's keys).
4. **The adapter renders a field the schema cannot validate, or misses a required one** (R271). Pinned by Task 3 (every JSON schema type, `required`, `default`, `enum`, `ui` hints, unknown types to a JSON editor; the rebuilt validator flags stored settings).
5. **Unavailable types or automations can be added** (D122, D35, R269). Pinned by Task 7 (availability per model) and Task 12 (disabled cards with the reason).
6. **Leaving or switching loses unsaved work silently** (D92, QBZ-17, R279). Pinned by Task 8 (switch model asks; discard resets) and Task 13 (router guard dialog, `beforeunload` only while dirty).
7. **Delete removes a workflow with running reviews or lies about why it cannot** (D115, QBZ-19). Pinned by Task 8 and Task 13 (blocked dialog with count, up to 5 reviews, text per Reassign permission).
8. **The review UI keeps showing an old workflow after a save** (A74, R277). Pinned by Task 5 (invalidation) and Task 8 (called after save and delete).
9. **Team, automation or AI lists leak data or fail silently** (Q42, R268, Q43). Pinned by Task 2 (id, name, memberCount only; editor gate) and Task 8 (option failure banner with Try again).
10. **Editor features active without the flag or without `editor`** (R211, D162). Pinned by Tasks 14, 15 (root tests flag on/off; editor off hides menu and route).

## Rulings

- R267. **Validation error data** (Q41). `WorkflowValidationError` (`[AWF]/domain/workflow/errors.ts`) takes an optional second constructor argument `WorkflowValidationErrorData { stepId: string | null; field: string | null; workflowId: string | null }`, defaulting every key to `null`, and exposes it as `data`. Every site in the editor's save path sets it: workflow-level `field` is `name`, `models` or `steps`; step-level `stepId` is the step's id and `field` one of `title`, `type`, `color`, `notifications`, `config.teams`, `config.assignment.rules`, `config.automationId`, `config.settings` or `config.settings.<path>` (when a zod issue has a path; `parseAutomationSettings` gains the issue path), `config.instructions`, `config.model`, `config.tools`, or `config.<zod issue path>` for a review config issue. The duplicate-model error (same code) sets `field: "models"` and `workflowId` of the bound workflow. The CMS and WB before-create/update handlers and the wrapper app-mismatch guards set `field: "models"`. No other error code changes; messages are unchanged. The site-by-site map is `research2-api.md` A.
- R268. **`listTeams`** (Q42). Shared query `workflows { listTeams(search: String, ids: [String!], limit: Int): WorkflowsTeamListResponse! }` returning `data: { teams: [WorkflowsTeamSummary!]!, missingIds: [String!]! }`, `WorkflowsTeamSummary { id: ID! name: String! memberCount: Int! }` (new type; `WorkflowsTeam` stays). Gated on `editor` like the other `workflows` fields. Built like `listUsers` (`ListWorkflowUsers` use case, feature, resolver, tests): api-core `ListTeamsUseCase` runs inside `identityContext.withoutAuthorization` (only that call), `search` is a case-insensitive name filter in memory, `ids` returns those teams and lists unknown ones in `missingIds`, `limit` default 50, max 200, sorted by name. `memberCount` comes from one admin-users list per call (each user has `teams`), counted in one pass, also inside `withoutAuthorization`. Exposes only `id`, `name`, `memberCount`.
- R269. **Step types in the editor** (D122, D35, QBZ-97). The editor lists every type from `listStepTypes` in the order returned. A type is addable only when `available` and, for `automation`, when at least one definition from `listAutomationDefinitions` covers the workflow's model (scope `*`, `<app>.*`, or the exact namespace; `matchesAutomationScope` rules mirrored in a pure client function). Disabled reasons use the design copy: AI `Requires the AI Power-Ups licence.`; Automation `No automations are available for this model.` (CMS) / `No automations are available for pages.` (WB); any other unavailable type shows the server's `unavailableReason`. UI names: `review` "People", `automation` "Automation", `ai` "AI" (D98); unknown types use the server `title`. The type cannot be changed later (D91).
- R270. **One FormModel form per step type** (D56, D66). The drawer builds one form per step: the common fields (Title, Colour, Description, Notify via) and the type's config fields. A People step config is `{ teams, assignment }`; 9a edits `teams` and carries `assignment` through unchanged, defaulting a new step to `{ strategy: "none", allowManualPick: false, rules: [] }` (the assignment section is 9b). An Automation step is `{ automationId, settings }`. An AI step is `{ instructions, model, tools }`. A step of an unknown type is shown read-only with its title and type and saved unchanged.
- R271. **JSON-schema to FormModel adapter** (D66). In `@webiny/app-admin` (`src/features/formModel/jsonSchema/`): `buildFieldsFromJsonSchema(schema: JsonSchema, registry: IFieldBuilderRegistry, options: JsonSchemaFieldOptions): Record<string, IFieldBuilder>` maps `string` to `text` (with `enum` to a `select` renderer; `ui: "textarea"` to `textarea`; other `ui` hints to the renderer named in `options.uiRenderers`), `number`/`integer` to `number` (min, max, integer), `boolean` to `boolean` (switch), `object` to `object().fields(...)`, `array` of strings to a text list (`tags` renderer) and of objects to `object().list()`, anything else to a JSON code editor field; `title` to label, `description` to help, `default` to `defaultValue`, the object's `required` to `required()` (a field with a `default` is not required). `createJsonSchemaValidator(schema: JsonSchema): JsonSchemaValidator` rebuilds a zod schema with `z.fromJSONSchema` and returns `{ validate(value: unknown): JsonSchemaValidationResult }`, `JsonSchemaValidationResult { valid: boolean; issues: JsonSchemaIssue[] }`, `JsonSchemaIssue { path: string; message: string }`. No secret fields (D67 superseded).
- R272. **Notify via** (D96, D129, D151, QBZ-45, QBZ-88). Checkboxes, one per transport from `listNotificationTransports` (title and optional description). A new People step starts with `e-mail` ticked when that transport exists; other types start with none. Ids on a loaded step that are not in the list are kept on save and not shown. With no transports: `Only in-app notifications are available. No other channels are configured.` The hint `In-app notifications are always sent. Who gets notified is set automatically from the step.` shows in both cases.
- R273. **Colour** (UI-2). Ten presets stored as the design's CSS variable strings in this order: Orange `var(--color-primary-500)`, Rust `var(--color-primary-800)`, Amber `var(--color-warning-600)`, Olive `var(--color-warning-800)`, Teal `var(--color-success-500)`, Green `var(--color-success-800)`, Red `var(--color-destructive-500)`, Maroon `var(--color-destructive-700)`, Grey `var(--color-neutral-500)`, Ink `var(--color-neutral-900)`; a custom colour is `#RRGGBB` (validated, `Enter a hex colour, e.g. #3B6FD4.`). A new step takes Orange. A loaded colour that is neither is kept and shown as custom when it is a hex, else as no selection.
- R274. **Automation step** (D14, D35, D37, QBZ-13, QBZ-14, QBZ-40). The automation is chosen from radio cards (name; description from the schema's top-level `description` when present) of the definitions covering the model. Its settings form comes from the adapter. Switching to another automation with settings entered asks `Switch to “{automation}”?` / `The settings for {current} are cleared. The change applies when you save the workflow.` with Cancel / Switch automation (no secret clause); without settings it switches at once. The card warning `The automation “{name}” no longer exists.` shows when the stored `automationId` is not listed; `Saved settings no longer validate: {error}` shows only when the stored settings fail `createJsonSchemaValidator` and the admin has not changed them in this session.
- R275. **AI step** (Q44, D101, D109, D138, D139, QBZ-8, QBZ-89). The AI editor exists only when the `ai` row is `available` and has a `configSchema` (then `listAiModels` exists; `research2-api.md` C); otherwise AI cards are disabled and an existing AI step is read-only with the licence warning (QBZ-47: move and delete stay enabled). Instructions (textarea, required, `Enter instructions for the AI.`), Model (picker over `listAiModels`, required, `Choose an AI model.`; a new step starts with none; a stored model not in the list shows the retired card and warning, QBZ-8, not a save blocker), Tools (checkboxes over `listAiTools`). Every AI string is the design's (`research2-admin.md` 5).
- R276. **Save** (D92, D108, D123, D131, QBZ-10, QBZ-11, QBZ-12, QBZ-18). Save is enabled only when dirty. Client validation first (QBZ-12 table: `Enter a workflow name.`, `Add at least one step.`, `Enter a title for this step.`, `Choose at least one reviewing team.`, `{Label} is required.` for required automation settings, `Enter instructions for the AI.`, `Choose an AI model.`); on failure the steps and fields are marked and the toast is `Fix the highlighted steps before saving.` (or `Fix the highlighted fields before saving.` when only the name or the step count is wrong). Then the store mutation with the loaded `savedOn` string (null for a new workflow or for Save as new). Results: success replaces the draft baseline with the returned workflow, toast `Workflow saved`; `Validation` with a `stepId` marks that step and field, toast `Could not save. Check the highlighted step.`; `Validation` with a `workflowId` shows the duplicate banner `Could not save the workflow — {Model} already has a workflow: “{name}”.` (WB: `Pages already have a workflow: “{name}”.` per QBZ-44) with Reload (QBZ-18 dialog, then loads that workflow); other `Validation` shows `Could not save the workflow — {server message}` (Q43); `Conflict` opens `Someone else changed this workflow` (name from `savedBy.displayName`, else `Someone`) with Keep editing / Reload workflow, reload toast `Loaded the latest version`; `NotFound` opens `This workflow was deleted` (D123 text) with Discard changes / Save as new workflow (same id, `savedOn` null), toast `Saved as a new workflow`; a transport error shows the QBZ-10 banner with Try again. The draft stays dirty on every failure.
- R277. **Review cache** (A74). `IReviewReadUseCases` gains `invalidateWorkflows(): void`, which clears the shared `ReviewUseCases` workflow cache; the editor calls the app's review use cases after a successful save and delete.
- R278. **Delete** (D115, QBZ-19). `Delete workflow?` / `“{name}” will be removed from {Model}. New revisions can then be published without a review. Finished reviews keep their history.` with Cancel / Delete workflow; toast `Workflow deleted`; on `HasActiveReviews` the blocked dialog `This workflow can't be deleted yet` with the count text (singular/plural), the listed reviews (`{title}` and `Step {n} of {N} · {step}`, each opening that content through the app's content link), the closing sentence chosen by the viewer's `reassign` permission, and only Close. Deleting a step: `Delete step?` dialog (design text), removed from the draft (saved with the workflow).
- R279. **Leaving** (D92, QBZ-17). Switching the model with a dirty draft asks `Discard unsaved changes?` (design body) with Keep editing / Discard changes. Leaving the editor route through the router does the same through `useRouter().addTransitionGuard` and `useDialogs`. While dirty, `beforeunload` asks the browser's own prompt.
- R280. **Model list** (D116, QBZ-20). CMS: `listCmsEntryWorkflowModels` 20 per page, server search (a new search restarts at the first page), `Load more` while `hasMoreItems`, empty `No models match “{q}”.`; each row shows the model icon (joined from the admin `ModelsCache` by `modelId`), the name, `{n} steps`/`No workflow` (step count known only for the loaded workflow; other rows show the bound workflow's name or `No workflow`), the bound indicator and the unsaved dot for the open model. WB: a single row `Pages`, panel label `WEBSITE BUILDER`, no search.
- R281. **Copy without a design source** (Q43): options load failure `Could not load the step options.` + `Try again`; `Someone`; the D131 conflict text with no time; `Could not save the workflow — {server message}`; unknown transport ids kept silently.
- R282. **Shared Picker** (UI-3). `WorkflowPicker` (single) and `WorkflowMultiPicker` (chips) in `[AW]/components/picker/` over admin-ui `AutoComplete` / `MultiAutoComplete`, with a search callback, at most 50 visible options followed by `More matches. Keep typing to narrow the list.`, and optional per-option warning icon (teams with `memberCount` 0 show `This team has no members`). 9a uses it for teams and AI models; 9b reuses it for users and folders.

## Assumptions

- A97. `z.fromJSONSchema` exists in the zod version `app-admin` resolves; Task 3 verifies and, if absent, adds zod 4 to `app-admin` dependencies (adio) and says so.
- A98. `SortablePresenter` (`app-admin/src/presentation/sortable`) is registered in the admin container; Task 12 verifies and registers its feature from the editor feature if not.
- A99. api-core exposes an admin-users list use case returning users with `teams` (or `teamIds`); Task 2 names it and runs it inside `withoutAuthorization`.

## Decisions

Recorded by Task 17 (no SEC ids).

- **D165. Validation errors point at the step and field.** `Workflows/Workflow/Validation` carries `{ stepId, field, workflowId }`; the duplicate-model error names the bound workflow. Refines D92. Source: Q41, R267.
- **D166. Workflows lists teams for the editor.** `workflows.listTeams` returns id, name and member count, gated on `editor`. Source: Q42, R268.
- **D167. The AI step editor ships with the editor.** Phase 9a builds the AI step editor; 9c keeps the settings page and the permission UI. Source: Q44.
- **D168. Step forms per type.** The drawer builds one FormModel form per step type; automation settings come from the JSON-schema adapter in `app-admin`. Refines D66 (no dynamic zone). Source: R270, R271.
- **D169. Colour presets are theme tokens.** A preset colour is stored as its CSS variable string, a custom colour as hex. Source: R273.

## Task order

1. **9a.1:** Task 1, Task 2 (independent).
2. **9a.2:** Task 3, Task 4 (independent).
3. **9a.3:** Task 5 -> Task 6.
4. **9a.4:** Task 7 -> Task 8.
5. **9a.5:** Task 9 -> Task 10 -> Task 11.
6. **9a.6:** Task 12 -> Task 13.
7. **9a.7:** Task 14 -> Task 15 -> Task 16.
8. **9a.8:** Task 17.

Dependencies: 9a.3 needs 9a.1's SDL for its documents. 9a.4 needs 9a.3. 9a.5 needs 9a.2 and 9a.4. 9a.6 needs 9a.5. 9a.7 needs 9a.6. 9a.8 needs everything.

## Sub-phases

| Sub-phase | Folder | Tasks |
|---|---|---|
| 9a.1 API | `9a.1-api/` | 1, 2 |
| 9a.2 Admin foundations | `9a.2-admin-foundations/` | 3, 4 |
| 9a.3 Editor core | `9a.3-editor-core/` | 5, 6 |
| 9a.4 Editor model and presenter | `9a.4-editor-presenter/` | 7, 8 |
| 9a.5 Step editor | `9a.5-step-editor/` | 9, 10, 11 |
| 9a.6 Editor view | `9a.6-editor-view/` | 12, 13 |
| 9a.7 App glue and cleanup | `9a.7-app-glue-cleanup/` | 14, 15, 16 |
| 9a.8 Docs | `9a.8-docs/` | 17 |

## Not in this phase

9b: the People step's Assignment tab (strategy, manual pick, routing rules, rule inspector), Test routing, user and folder pickers, saved-reference resolution (D117), rule warnings. 9c: the workflow settings page (exclusions) and the workflows permission UI. Several workflows per model. Secret settings. Model-delete dialog changes (Model Delete prototype). Marking the design boards implemented (`/design-pull mark` after 9c).

## Interfaces by task

Shorthands as 8b: `[AWF]` api-workflows/src, `[CMSA]`, `[WBA]`, `[AW]` app-workflows/src, `[AWT]` app-workflows/src/review/testing, `[CMSW]`, `[WBW]`; `[ADM]` = `packages/app-admin/src`; `[AWE]` = `packages/app-workflows/src/editor`; `[AWET]` = `packages/app-workflows/src/editor/testing`. Research cites existing files with lines; writers re-read every file they change.

### Task 1: Validation error data

- **Files:** `[AWF]/domain/workflow/errors.ts`; the `fail` helpers and sites in `[AWF]/domain/workflow/WorkflowValidator.ts`, `[AWF]/features/stepTypes/ReviewStepType/ReviewStepType.ts`, `[AWF]/features/stepTypes/AutomationStepType/AutomationStepType.ts` (and `parseAutomationSettings` to expose the issue path), `[AWF]/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`; `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType.ts`; the CMS before-create/update handlers and app-mismatch guards in `[CMSA]`, the WB guards in `[WBA]`. Tests: a new `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts` (one case per site class: name, models, steps, title, review teams, review rules, review zod path, automation id, automation settings path, unknown type, duplicate model with `workflowId`, user-target membership), an AI case in `ai-powerups` tests, a CMS and a WB GraphQL case asserting `error.data`.
- **Produces:** R267 (`WorkflowValidationErrorData`).

### Task 2: `workflows.listTeams`

- **Files:** `[AWF]/features/teams/ListWorkflowTeams/{abstractions.ts, ListWorkflowTeamsUseCase.ts, feature.ts, index.ts}` (mirror `ListWorkflowUsers`), `[AWF]/graphql/WorkflowsSchemaFactory.ts` (types and field), `[AWF]/WorkflowsFeature.ts`. Tests mirroring the `listUsers` tests (search, ids + missingIds, limit clamp, sort, memberCount, not editor -> `Workflows/NotAuthorized`, only id/name/memberCount), `workflowsSchema.test.ts`, `registration.test.ts`.
- **Produces:** R268.

### Task 3: JSON-schema adapter and validator (`app-admin`)

- **Files:** create `[ADM]/features/formModel/jsonSchema/{JsonSchema.ts (types), buildFieldsFromJsonSchema.ts, createJsonSchemaValidator.ts}` with co-located tests; export from `[ADM]/index.ts` FormModel section (`buildFieldsFromJsonSchema`, `createJsonSchemaValidator` and their types).
- **Produces:** R271 names: `JsonSchema`, `JsonSchemaFieldOptions { uiRenderers: Record<string, string> }`, `JsonSchemaValidator`, `JsonSchemaValidationResult`, `JsonSchemaIssue`.

### Task 4: Shared Picker

- **Files:** `[AW]/components/picker/{WorkflowPicker.tsx, WorkflowMultiPicker.tsx, PickerOption.ts, limitPickerOptions.ts}` with tests.
- **Produces:** `PickerOption { id: string; label: string; description: string | null; warning: string | null }`; `WorkflowPicker` props `{ value: string | null; options: PickerOption[]; onSearch(search: string): void; onChange(id: string | null): void; placeholder: string; disabled: boolean }`; `WorkflowMultiPicker` same with `values: string[]` and `onChange(ids: string[])`; `limitPickerOptions(options: PickerOption[]): LimitedPickerOptions` (`{ options, hasMore }`, cap 50).

### Task 5: Editor core

- **Files (`[AWE]`):** `domain/types.ts` (`EditorWorkflow`, `EditorStep`, `EditorStepType`, `AutomationDefinition`, `NotificationTransport`, `WorkflowTeamSummary`, `AiModel`, `AiTool`, `WorkflowModelRow`, `WorkflowModelPage`), `domain/WorkflowErrorCode.ts` (`NotFound`, `Conflict`, `Validation`, `Persistence`, `HasActiveReviews`, `NotAuthorized`), `gateway/{dto.ts, editorFields.ts (EDITOR_WORKFLOW_FIELDS incl. notifications, savedOn, savedBy, createdOn), mapEditorWorkflow.ts, IWorkflowEditorGateway.ts, IWorkflowConfigGateway.ts, WorkflowConfigGateway.ts (token), WorkflowConfigGatewayImpl.ts (one shared implementation over `MainGraphQLClient`, `workflows` root; `listAiModels` queried only when asked)}`, `useCases/{IWorkflowEditorUseCases.ts, WorkflowEditorUseCases.ts (plain shared class, R237), IWorkflowConfigUseCases.ts, WorkflowConfigUseCases.ts (token), WorkflowConfigUseCasesImpl.ts}`, `feature.ts` (`WorkflowEditorServicesFeature` registering the config gateway and use cases), `testing/` fakes and fixtures; `[AW]/review/useCases/{IReviewReadUseCases.ts, ReviewUseCases.ts}` (R277) and `[AWT]/fakeReviewUseCases.ts`. Tests: mappers, both use-case classes (envelope error -> `GraphQLOperationError` with code and data), config gateway documents.
- **Produces:** `IWorkflowEditorGateway { listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>; getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>; storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>; deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> }`, `ListWorkflowModelsParams { search: string; limit: number; after: string | null }`, `StoreWorkflowParams { data: EditorWorkflowInput; savedOn: string | null }`; `IWorkflowEditorUseCases` with the same four methods returning domain types and throwing `GraphQLOperationError`; `IWorkflowConfigUseCases { listStepTypes(); listAutomationDefinitions(); listNotificationTransports(); listTeams(params: ListTeamsParams); listAiModels(); listAiTools() }`; `invalidateWorkflows(): void` on `IReviewReadUseCases`.

### Task 6: CMS and WB editor gateways

- **Files:** `[CMSW]/features/editorGateway/{CmsWorkflowEditorGateway.ts, CmsWorkflowEditorGatewayImpl.ts, CmsWorkflowEditorUseCases.ts, CmsWorkflowEditorUseCasesImpl.ts (subclass), feature.ts, graphql/{listCmsEntryWorkflowModels, getCmsEntryWorkflow, storeCmsEntryWorkflow, deleteCmsEntryWorkflow}.ts}`; WB mirror `[WBW]/features/editorGateway/` with `listModels` returning the single `wb.page` row (`Pages`, its bound workflow found through `listWebsiteBuilderPageWorkflows`). Tests per gateway and the two-subclass test; root tests register the tokens with the flag on only.

### Task 7: `WorkflowDraft` and pure helpers

- **Files (`[AWE]/model`):** `WorkflowDraft.ts` (MobX: `name`, `steps`, `baseline`, `isDirty`, `setName`, `addStep(index, step)`, `updateStep(stepId, patch)`, `moveStep(from, to)`, `removeStep(stepId)`, `toInput(): EditorWorkflowInput`, `reset(workflow)`), `createNewStep.ts` (per type defaults, R270, R272, R273), `validateWorkflowDraft.ts` (R276 client rules -> `WorkflowDraftErrors`), `getStepTypeOptions.ts` (R269), `matchesAutomationScope.ts`, `getStepSummary.ts` (design summary lines), `getStepWarnings.ts` (team no members, automation missing, stale settings, retired AI model, AI licence missing), with tests.

### Task 8: `WorkflowEditorPresenter`

- **Files (`[AWE]/presentation/editor`):** `abstractions.ts` (token, `WorkflowEditorInitParams { useCases: IWorkflowEditorUseCases; reviewUseCases: IReviewReadUseCases; app: WorkflowEditorAppAdapter }`, VM), `WorkflowEditorPresenter.ts`, `mapSaveError.ts`, `feature.ts`; `[AWE]/WorkflowEditorAppAdapter.ts` (`{ appKind: "cms" | "wb"; panelLabel: string; modelLabel(row): string; getModelIcon(modelId: string): string | null; getContentUrl(review: BlockingReview): string }`). Tests: load, search, load more, select, create, switch with dirty, save success/each error, reload, save as new, delete success/blocked, option load failure and retry, invalidation calls.

### Task 9: Step forms (People, Automation) and renderers

- **Files (`[AWE]/presentation/stepForm`):** `buildCommonFields.ts`, `buildPeopleStepForm.ts`, `buildAutomationStepForm.ts`, renderers `renderers/{StepColourRenderer, TeamsPickerRenderer, AutomationCardsRenderer, TransportCheckboxesRenderer}.tsx` (registered through `AdminConfig.Form.FieldRenderer` from the editor feature) with tests.

### Task 10: AI step form

- **Files:** `buildAiStepForm.ts`, `renderers/{AiModelPickerRenderer, AiToolsRenderer}.tsx` with tests (empty, failed, no model, retired model, licence read-only).

### Task 11: Step drawer

- **Files (`[AWE]/presentation/stepDrawer`):** presenter (open/close, form per type, server error on field, tab error dots computed by the presenter because FormView tabs have none, Done applies to the draft), `StepDrawer.tsx`, tests.

### Task 12: Editor view

- **Files (`[AWE]/presentation/editor/components`):** `WorkflowEditorView.tsx`, `ModelPanel.tsx`, `EditorHeader.tsx`, `WorkflowFlow.tsx`, `StepCard.tsx`, `StepTypePicker.tsx`, empty/loading/error/no-permission states, drag via `SortablePresenter` plus up/down; tests.

### Task 13: Dialogs, banners, toasts, leave guard

- **Files:** `[AWE]/presentation/editor/components/dialogs/*`, `banners/*`, `useLeaveGuard.ts` (router guard + `beforeunload`); tests.

### Task 14: CMS mounting

- **Files:** `[CMSW]` route and menu for `/cms/workflows` rewritten over the shared editor view (editor gate), the CMS app adapter (model icons from `ModelsCache`), registration; `index.test.tsx` flag on/off and editor off.

### Task 15: WB mounting

- **Files:** `[WBW]` route and menu for `/website-builder/workflows` (editor gate added to the menu), the WB app adapter; tests.

### Task 16: Delete the old editor

- **Files:** delete the old editor in `app-workflows` (43 files, `permissionsSchema.ts` and the permission files kept), the CMS 5 and WB 2 old files, old exports in `[AW]/index.tsx` (`Components.Admin.WorkflowsEditor`, `IWorkflowApplication`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature`, `useCanUseWorkflows` if unused), old `types.ts` entries (keep `IWorkflowsSecurityPermission`), the `app.tsx` registrations; update `app.cleanup.test.tsx` (KEPT_PATHS), the CMS and WB cleanup and wiring tests.

### Task 17: Docs

- **Files:** `decisions.md` (D165-D169, notes on D66, D92, D122), spec 13.2 and 4.1 (`automationId`), roadmap rows 9a (Built) and 9c (AI editor moved), `app.md`, `api.md`, `integrations.md`. No SEC ids.
