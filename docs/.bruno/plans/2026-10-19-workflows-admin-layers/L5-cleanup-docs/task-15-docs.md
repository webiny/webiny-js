### Task 15: Decisions D183-D187, spec 13.1, roadmap and the guides

R359 (docs), R342-R364, D183-D187 (`../00-shared.md` "Decisions", the source text), Q69-Q76 of `../00-answers.md`, the Global Constraint "SEC ids appear only in plan files" (8a); spec 13.1 as built; the roadmap row. Model: `../../2026-10-19-workflows-phase-9c/9c.6-cleanup-docs/task-18-docs.md`. A docs task: no TDD cycle and no code. **Every sentence below is a claim about code Tasks 1-14 built. Step 1 re-reads that code before any text is written, and a claim the code contradicts is corrected in the doc (in the script of the step that writes it), never kept and never fixed in code.** The task files of this plan were written in parallel, so a contract name that an executor changed is corrected here and listed in the commit body and under "Contract notes" of the report.

- **Decisions** (`docs/.bruno/workflows/decisions.md`, last entry today D182): append D183 (admin data layer per operation), D184 (per-app gateways behind a routing gateway), D185 (the workflow list is cached in `ReviewRepository`), D186 (workflows admin tests follow the layers) and D187 (configuration is its own area) in the neighbours' format (`## D183. Title`, body, `**Refines** ...` where the contract names one, `Covers R.... Decided 2026-10-19 (admin layers plan, user answer(s) Q...).`). Add a "Refined by D183 and D184" note to D159 that also records R237's narrower scope (the subclass rule no longer applies to the data layer) and R243's fakes (D186). No other decision describes the old bundles (Step 2 proves it).
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): the status line and the range D1-D187; 13.1: the singletons sentence, the shared-core bullet, the per-app bullet (app gateways under a shared token behind a routing gateway, use cases once in `app-workflows`, the configuration area, the settings layers), the envelope bullet (the area or routing gateway, not the use cases, turns `error` into `GraphQLOperationError`) and the workflow-list sentence of the flag bullet.
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D187 and a new row "Admin layers" **Built** after row 9c (plan folder, five sub-phases).
- **Guides** (`docs/.bruno/workflows/`): `app.md` (intro; section 1: the layout of `review/`, the new `config/`, `[AW]/gateway/` and `[AW]/domain/WorkflowAppKind.ts`, the public API bullet; section 2: layering, routing, registration order, errors, tests; section 3: the mounting feature's `resolve`, the editor gateways, repository and use cases, the cache invalidation after save and delete; section 3a: the settings services; section 4: the editor session, the lists and widgets, trash; section 5: the configuration gateway's home and the settings names source; section 6: the consumer contract; section 9: what the refactor did not build), `integrations.md` (the CMS and WB review features, the editor gateways and mounting features, the CMS trash pre-check, the editor integration point), `README.md` (the map sentence, the `app.md` line, the phase table). `api.md` describes the API, which this plan did not change (R342); `automations.md`, `ai-tools.md`, `notifications.md`, `bugs.md`, `open-questions.md`, `infrastructure.md`, `routing.md` and `variants-review-gap.md` have no statement the refactor changed (Step 2 proves it).
- **No SEC id** in any committed file.

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `docs/.bruno/workflows/integrations.md`, `docs/.bruno/workflows/README.md`

**Interfaces:**
- Consumes: the whole plan as committed (Tasks 1-14), the `## Decisions` and `## Rulings` of `../00-shared.md` (D183-D187, R342-R364, A113-A117), Q69-Q76 of `../00-answers.md`, the execution rulings of this plan's execution ledger, and the existing docs as quoted in the scripts below (every `old` text is asserted unique by the helper that uses it; all anchors were checked against the docs at BASE d31d2bcd08 by running every script on a copy, and the Step 7 greps were run on the result).
- Produces: the recorded decisions D183-D187 and the as-built documentation, no code. Acceptance: Step 7 prints what it says; no SEC id.

**How to apply an edit:** every edit is a short Python script that asserts each `old` text occurs exactly once (`rep`, `rep_line`, `add_after_line`, `note`; repeated in each script because each runs on its own). A failed assertion means the document changed since this plan was written: open the file, find the current text of that sentence, change the `old` string in the script (never the intent) and record the change in the commit body. Run the scripts from the repository root with `python3 -I -`. When Step 1 or Step 1b shows the code differs from a sentence, edit the sentence inside the script before running it. `docs/` is in the formatter's `ignorePatterns` (`.oxfmtrc.json`), so no line wrapping is applied to these files.

- [ ] **Step 1: Re-read the built code (every claim is checked here first)**

Run each block from the repository root and read the output; do not skim. The names in the scripts below are the contract's (`../00-shared.md` "Interfaces by task" and R343-R364); this step is where a rename by an executor is found. Keep a scratch list (in the scratchpad directory, not in the repo) of every name or text that differs, and apply it to the scripts of Steps 3-6 before running them.

```bash
# Commits and folders (Tasks 1-14)
git log --oneline d31d2bcd08..HEAD | cat
ls packages/app-workflows/src/gateway packages/app-workflows/src/config packages/app-workflows/src/config/useCases packages/app-workflows/src/settings/useCases packages/app-workflows/src/editor/useCases packages/app-workflows/src/editor/appGateway packages/app-workflows/src/review/appGateway packages/app-workflows/src/review/useCases packages/app-workflows/src/review/repository
ls packages/app-workflows/src/domain/WorkflowAppKind.ts packages/app-workflows/src/review/domain/ReviewListPage.ts packages/app-workflows/src/gateway/toOperationError.ts

# Every exported name the docs use (prints "name => file"; an empty right side is a rename or a gap)
for n in GetWorkflowSettingsUseCase UpdateWorkflowSettingsUseCase ListStepTypesUseCase ListAutomationDefinitionsUseCase ListNotificationTransportsUseCase ListWorkflowTeamsUseCase ListWorkflowUsersUseCase ListAiModelsUseCase ListAiToolsUseCase ListWorkflowModelsUseCase GetWorkflowUseCase StoreWorkflowUseCase DeleteWorkflowUseCase InspectRoutingUseCase FolderExistsUseCase GetBoundWorkflowUseCase GetTargetReviewUseCase GetReviewUseCase ListStepCandidatesUseCase ListReviewStepCandidatesUseCase GetStepRunUseCase ListReviewsUseCase RequestReviewUseCase StartReviewStepUseCase TakeOverReviewStepUseCase ReassignReviewStepUseCase ApproveReviewStepUseCase RejectReviewStepUseCase CancelReviewUseCase RestartReviewStepUseCase CancelReviewsForDeleteUseCase ListBlockingReviewsUseCase WorkflowSettingsRepository WorkflowSettingsGateway WorkflowConfigRepository WorkflowConfigGateway WorkflowEditorRepository WorkflowEditorGateway ReviewRepository ReviewGateway ReviewAppGateway WorkflowEditorAppGateway WorkflowSettingsRepositoryFeature WorkflowConfigRepositoryFeature WorkflowEditorRepositoryFeature ReviewRepositoryFeature WorkflowSettingsServicesFeature WorkflowConfigServicesFeature WorkflowEditorServicesFeature ReviewServicesFeature toOperationError WorkflowAppKind ReviewListPage IReviewAppGateway IWorkflowEditorAppGateway CmsReviewGateway WbReviewGateway CmsWorkflowEditorGateway WbWorkflowEditorGateway CmsWorkflowEditorFeature WbWorkflowEditorFeature CmsWorkflowEditorMountingFeature WbWorkflowEditorMountingFeature; do printf '%s => ' "$n"; grep -rlE "export (const|type|interface|function|class) $n\b" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --include='*.ts' --include='*.tsx' | grep -v "\.test\." | head -2 | tr '\n' ' '; echo; done

# Tokens, multi-injection, routing errors, the helper (Tasks 1, 5, 7)
grep -rn "createAbstraction" packages/app-workflows/src/review/appGateway/abstractions.ts packages/app-workflows/src/editor/appGateway/abstractions.ts packages/app-workflows/src/review/gateway/abstractions.ts packages/app-workflows/src/editor/gateway/abstractions.ts packages/app-workflows/src/review/useCases/getReview/abstractions.ts
grep -rn "multiple: true" packages/app-workflows/src --include='*.ts' | grep -v "\.test\."
grep -rn "No workflows app" packages/app-workflows/src --include='*.ts' | grep -v "\.test\."
grep -n "The request failed\." packages/app-workflows/src/gateway/toOperationError.ts
grep -rn "canHandle\|readonly app" packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.ts packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.ts packages/app-headless-cms-workflows/src/features/editorGateway packages/app-website-builder-workflows/src/features/editorGateway --include='*.ts' | grep -v "\.test\."
grep -n "name:\|container.register\|return {" packages/app-headless-cms-workflows/src/features/gateway/feature.ts packages/app-headless-cms-workflows/src/features/editorGateway/feature.ts packages/app-website-builder-workflows/src/features/gateway/feature.ts packages/app-website-builder-workflows/src/features/editorGateway/feature.ts
grep -n -A4 "resolve(container)" packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts packages/app-website-builder-workflows/src/features/editorMounting/feature.ts packages/app-workflows/src/editor/feature.ts
grep -n "name:\|register(container)\|\.register(container)" packages/app-workflows/src/settings/feature.ts packages/app-workflows/src/config/feature.ts packages/app-workflows/src/editor/feature.ts packages/app-workflows/src/review/feature.ts

# Business rules and the cache (Tasks 1, 8, 10)
grep -n "includeExpired" packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.ts
grep -n "namespaces.includes" packages/app-workflows/src/review/useCases/getBoundWorkflow/GetBoundWorkflowUseCase.ts
grep -n "invalidateWorkflows\|NotFound" packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.ts packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.ts
grep -n "new Map\|hasMoreItems\|invalidateWorkflows" packages/app-workflows/src/review/repository/ReviewRepository.ts
grep -rn "invalidateWorkflows" packages/app-workflows/src/editor/presentation --include='*.ts' | grep -v "\.test\."

# Consumers and mounts (Tasks 6, 10-13)
grep -rn "app=\"cms\"\|app=\"wb\"" packages/app-headless-cms-workflows/src/Components packages/app-website-builder-workflows/src/Components --include='*.tsx' | grep -v "\.test\."
grep -n "vm.namespace" packages/app-workflows/src/review/editor/components/EditorReviewBar.tsx
grep -n -A4 "interface IEditorReviewSession" packages/app-workflows/src/review/editor/abstractions.ts
grep -n "dependencies:" -A3 packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.ts packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.ts
ls packages/app-workflows/src/editor/testing/editorPresenterSetup.ts packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts packages/app-headless-cms-workflows/src/testing/createEntrySession.ts packages/app-website-builder-workflows/src/testing/createFakeSession.ts
ls packages/app-workflows/src/config/testing packages/app-workflows/src/review/testing | grep -E "^fake|UseCaseFakes"

# Nothing old left (Task 14) and no API change (R342)
ls packages/app-workflows/src/review/useCases/ReviewUseCases.ts packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases packages/app-headless-cms-workflows/src/features/gateway/CmsReviewAppGateway packages/app-website-builder-workflows/src/features/gateway/WbReviewAppGateway 2>&1 | cut -c1-120
git diff --stat d31d2bcd08..HEAD -- 'packages/api-*' | tail -3
```

Expected: the commits of Tasks 1-14 (no docs commit of this plan yet); the folders, with one folder per operation (`config/useCases/` seven, `settings/useCases/` two, `editor/useCases/` six, `review/useCases/` seventeen, and no loose file in those four); every name of the loop prints at least one file; the four tokens `Workflows/ReviewAppGateway`, `Workflows/WorkflowEditorAppGateway`, `Workflows/ReviewGateway`, `Workflows/WorkflowEditorGateway` and `Workflows/GetReviewUseCase`; two `multiple: true` lines (the two routing gateways); three "No workflows app ..." lines (the namespace and the app message in `review/gateway/ReviewGateway.ts`, the app message in `editor/gateway/WorkflowEditorGateway.ts`); `The request failed.` in the helper; `app` in the four app gateways and `canHandle` in the two review gateways; `CmsReviewFeature` / `WbReviewFeature` register the gateway, the adapter, the row provider and two handlers and return `contentAdapter` and `rowProvider`; the editor mounting features return `app` only and `WorkflowEditorServicesFeature` returns `toasts` only; the composite features call `XFeature.register(container)`; `includeExpired: true`; `namespaces.includes(namespace)`; `invalidateWorkflows` and `NotFound` in both editor use cases; the `Map` cache and the meta default in `ReviewRepository`; no `invalidateWorkflows` in the editor presentation; `app="cms"` and `app="wb"` in the Content Reviews mounts; `vm.namespace` in `EditorReviewBar`; `IEditorReviewSession` without `useCases`; the guard on `CancelReviewsForDeleteUseCase`, the CMS bulk decorator on `ListBlockingReviewsUseCase`, the list and widget presenters on `ListReviewsUseCase`; the five kits, and the seven `fakeList<Name>UseCase.ts` of `config/testing/` and `fakeReviewAppGateway.ts`, `fakeReviewGateway.ts`, `createReviewUseCaseFakes.ts`, `registerReviewUseCaseFakes.ts`, `createTrashUseCaseFakes.ts`, `registerTrashUseCaseFakes.ts` of `review/testing/` (`targetReviewFakes.ts` holds no use-case wiring and is unchanged, Task 10); "No such file or directory" for the four old paths; the last command prints nothing. Every name of the scripts below that differs is replaced by the as-built name.

- [ ] **Step 1b: Read the execution rulings**

```bash
ls .superpowers/sdd/*/exec-ledger.md 2>/dev/null
head -1 .superpowers/sdd/layers-plan/exec-ledger.md 2>/dev/null
```

The ledger of this plan is the `exec-ledger.md` whose first line names the admin layers refactor (by the planning ledger's location, `.superpowers/sdd/layers-plan/exec-ledger.md`; if the controller keeps it in another folder, the `ls` shows it). If no such ledger exists, stop and report: the docs are not written without it. Then:

```bash
grep -n "^Ruling\|^Task [0-9a-z]*: implemented\|DONE_WITH_CONCERNS\|^PRE-MERGE\|^Final\|Contract note" <that ledger> | cut -c1-400
```

If it has no "Ruling" lines, there is nothing to record from rulings: write `Execution rulings recorded: none` in Step 8 and still read the `DONE_WITH_CONCERNS`, contract-note and final-review lines. Otherwise read every "Ruling:" line, every `DONE_WITH_CONCERNS` entry, every contract note an executor reported and every final-review "FIX" / "LEAVE" line (and, where a ruling names a task report, that report). For each, decide and note in the scratch list:

1. **Changes a name, a file home, a routing key, an error text or a test convention** the docs state: the docs must say what was built. Put it in the matching text: a decision body (Step 3), the spec bullet (Step 4), the roadmap row (Step 5), `app.md` or `integrations.md` (Step 6). A ruling that contradicts a sentence of this task changes that sentence.
2. **A bug found on the way and left for later** (R342 forbids fixing it here): add it to the `app.md` section 9 bullet of Step 6a ("Admin layers ..., not built") as "Found, not fixed: ...", and name it in the commit body.
3. **Internal only** (a test helper's shape, a refactor with no effect on a documented name): leave it out of the docs.

Every ruling of the first two kinds is listed in the commit body of Step 8 after `Execution rulings recorded:` and in the report under "Execution rulings".

- [ ] **Step 2: Baseline greps**

```bash
grep -rnE "ReviewUseCases|WorkflowEditorUseCases|WorkflowConfigUseCases|WorkflowSettingsUseCases|IReviewListUseCases|IReviewReadUseCases|reviewUseCases|useCases[ ,}\`]|invalidateWorkflows\(\)|createFakeUseCases" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/workflows/decisions.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -d: -f1,2
grep -rnE "ReviewUseCases|WorkflowEditorUseCases|WorkflowConfigUseCases|WorkflowSettingsUseCases|useCases|invalidateWorkflows|use-case token" docs/.bruno/workflows/api.md docs/.bruno/workflows/automations.md docs/.bruno/workflows/ai-tools.md docs/.bruno/workflows/notifications.md docs/.bruno/workflows/bugs.md docs/.bruno/workflows/open-questions.md docs/.bruno/workflows/infrastructure.md docs/.bruno/workflows/routing.md docs/.bruno/workflows/variants-review-gap.md | cut -c1-120
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D182" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-60
grep -c "^## D18[3-7]\." docs/.bruno/workflows/decisions.md
```

Expected at plan time (BASE d31d2bcd08): the first grep prints `integrations.md:33`, `:38`, `:43`, `app.md:19`, `:22`, `:30`, `:32`, `:43`, `:45`, `:48`, `:57`, `:67`, `:69`, `:85`, `decisions.md:995` (the D159 body, historical, kept) and the spec's 13.1 lines `511` and `512`; the second prints nothing; the third prints nothing; the fourth shows the spec status line and the roadmap header; the fifth prints `0`. A hit the scripts below do not rewrite (another line, another file) is a sentence written after this plan: fix it in the matching script and list it in the commit body.

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

The script adds the note at the end of D159 (before the next `## D` heading) and appends D183-D187 at the end of the file. Run it once; it asserts every anchor and refuses to run twice.

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

assert t.count("\n## D183. ") == 0, "D183 already recorded"

t = note(t, 159, """_Refined by D183 and D184 (admin layers plan, 2026-10-19): the shared `ReviewUseCases` class, its per-app subclasses and tokens, the per-app editor use-case subclasses and the runtime passing of use cases through `init()`, props, the row binding and the editor session are gone. The data layer is one use case per operation over one repository and one gateway per area, all in `app-workflows`; an app package registers only its review and editor gateways, under the shared `ReviewAppGateway` and `WorkflowEditorAppGateway` tokens, and the routing `ReviewGateway` and `WorkflowEditorGateway` pick one by the review's namespace or by the app. The R237 subclass rule no longer applies to the data layer; it still applies to `AppReviewRowProvider`, `EditorReviewSession`, `ReviewNotificationHandler`, `ReviewChangeMessageHandler` and `ReviewCacheSyncHandler`. The R243 fixtures stay in `review/testing/`; the aggregate fakes are replaced by one fake per injected use case (D186)._""")

NEW = """

## D183. Admin data layer per operation

The three workflows admin packages follow the Webiny admin convention presenter → use case → area repository → area gateway. Each of the 32 operations is one use case (`<Name>UseCase`, one `execute`, transient, the decoration point) that lives once in `app-workflows`, in `useCases/<operation>/` of its area (`abstractions.ts` with the interface, the `Params` type, the token `Workflows/<Name>UseCase` and the namespace; `<Name>UseCase.ts`; `feature.ts` exporting `<Name>Feature`); the 33rd old operation, `invalidateWorkflows`, is a repository call (D185). Each area has one repository and one gateway, both singletons: settings `WorkflowSettingsRepository` / `WorkflowSettingsGateway`, configuration `WorkflowConfigRepository` / `WorkflowConfigGateway` (D187), editor `WorkflowEditorRepository` / `WorkflowEditorGateway`, review `ReviewRepository` / `ReviewGateway`; `<Area>RepositoryFeature` registers the pair and the area's services feature registers it with the area's use-case features. The gateway runs the GraphQL call (or routes it, D184), turns an error envelope or missing data into `GraphQLOperationError` through the one helper `toOperationError` (`[AW]/gateway/`; code, message and data kept, "The request failed." when the server sends no message) and lets a transport error pass; `getTargetReview` and `getStepRun` return `null` for null data and `folderExists` accepts `false`. The repository maps DTOs to domain types (and the settings back to a DTO) and owns the area's cache; neither layer swallows an error. A use case holds a business rule only where there is one: `GetWorkflowSettingsUseCase` asks for the expired entries, `GetBoundWorkflowUseCase` filters the workflow list by namespace, `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` clear it. Presenters, services and decorators inject exactly the use cases they call and never a repository or a gateway. Names follow Website Builder `deletePageRevision`: no `Impl`, `Implementation` or `Abstraction` suffix on an exported or file name, only the abstraction is aliased. GraphQL documents, variables, values, errors, copy and refetch behaviour are unchanged.

**Refines** D159.

Covers R342, R343, R344, R346, R351, R352, R354, R360. Decided 2026-10-19 (admin layers plan, user answers Q70, Q71, Q72, Q76).

## D184. Per-app gateways behind a routing gateway

CMS and Website Builder register their review and editor gateways (`CmsReviewGateway`, `WbReviewGateway`, `CmsWorkflowEditorGateway`, `WbWorkflowEditorGateway`, which keep their names) under the shared multi-registration tokens `ReviewAppGateway` and `WorkflowEditorAppGateway`; each declares its `app` (`cms` or `wb`) and a review gateway also `canHandle(namespace)` (`cms.<modelId>` for the CMS, `wb.page` for Website Builder). The app-neutral routing gateways `ReviewGateway` and `WorkflowEditorGateway` take every registration and pick the first that claims the call: review-bound operations by the review's namespace (Q69), app-wide operations (every editor operation, `listReviews` for the Content Reviews list and the widgets, and the workflow list) by `app`, the namespace's app. The app gateway receives exactly the parameters it received before and keeps resolving with the `{ data, error }` envelope (R204); the routing gateway unwraps it once, so the conversion and the null rules exist once for both apps. A namespace or app nobody claims throws a plain `Error` ("No workflows app handles the namespace "x"." or "No workflows app is registered for "x"."), unreachable in a full admin. There is no per-app use case, repository, token or subclass in the data layer, and no use case travels through `init()`, props, the Content Reviews row binding or an editor session: mounts pass `app` or `namespace`. The routing gateways collect the app gateways when they are first built and the three roots register in the plugin pass before any route renders, so nothing resolves a use case, a repository or a routing gateway while the plugins render.

**Refines** D159, R204 and R237.

Covers R345, R347, R348, R349, R353, R356, R358, R361, R362, R363. Decided 2026-10-19 (admin layers plan, user answers Q69, Q70, Q71).

## D185. The workflow list is cached in `ReviewRepository`

`ReviewRepository` keeps one cached workflow list per app: concurrent and later reads share one request, a failed load is retried on the next read and clears only its own promise, and an invalidation during a load is not undone by that load. `GetBoundWorkflowUseCase` returns the workflow whose namespaces include the review's namespace, or `null`. `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` clear their app's list after a success and after a `NotFound` server error, never after another failure, so the editor presenter no longer does it; the dismissal of the "This workflow was deleted" dialog after a store therefore no longer clears the list, the failed store already did.

**Refines** R277.

Covers R350, R351. Decided 2026-10-19 (admin layers plan, user answer Q73).

## D186. Workflows admin tests follow the layers

Gateway tests run the real gateway over a fake `MainGraphQLClient` (document, variables, unwrapping, transport passthrough); routing gateway tests register two fake app gateways under the shared token; use-case tests use a fake area gateway with the real repository and, for review, the real cache; presenter and decorator tests register one `{ execute: vi.fn() }` fake per injected use case. The four aggregate fakes are gone; the setup kits (`editorPresenterSetup`, `exclusionsPageSetup`, `exclusionDialogSetup`, the CMS `createEntrySession` and the WB `createFakeSession`) keep their names as wiring helpers that register those fakes and return them by use-case name, over shared per-use-case factories (`config/testing/fakeList<Name>UseCase.ts`, `review/testing/createReviewUseCaseFakes.ts` and `registerReviewUseCaseFakes.ts`, `createTrashUseCaseFakes.ts` and `registerTrashUseCaseFakes.ts`); the routing and use-case tests use `createFakeReviewAppGateway` and `createFakeReviewGateway`. Every behaviour assertion of the old bundle tests was ported to the layer that now owns the behaviour before the bundle was deleted.

**Refines** R243.

Covers R355. Decided 2026-10-19 (admin layers plan, user answer Q74).

## D187. Configuration is its own area

The shared configuration lookups (step types, automation definitions, notification transports, teams, users, AI models and AI tools) moved from `editor/` to `[AW]/config/`: `WorkflowConfigGateway` (the `workflows` root; `listAiModels` is asked only when needed), `WorkflowConfigRepository`, seven use cases (`ListStepTypesUseCase`, `ListAutomationDefinitionsUseCase`, `ListNotificationTransportsUseCase`, `ListWorkflowTeamsUseCase`, `ListWorkflowUsersUseCase`, `ListAiModelsUseCase`, `ListAiToolsUseCase`) and `WorkflowConfigServicesFeature`, registered by `WorkflowsAdminApp`. The editor presenter and the settings page inject the use cases they call; the DTOs, field fragments and mappers stay in `editor/gateway/`.

Covers R344, R354, R364. Decided 2026-10-19 (admin layers plan, user answers Q72, Q75).
"""
t = t.rstrip("\n") + NEW
p.write_text(t)
PY
```

If Step 1 or Step 1b shows a different name (a use case, a repository, a feature, a token string, an error text) or a different rule (the routing key of an operation, the cache semantics, the kits' names), change the decision text, not the code.

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
rep("updated 2026-10-19 (phase 9c:", "updated 2026-10-19 (admin layers: D183 admin data layer per operation; D184 per-app gateways behind a routing gateway; D185 the workflow list is cached in `ReviewRepository`; D186 workflows admin tests follow the layers; D187 configuration is its own area), earlier updated 2026-10-19 (phase 9c:")
rep("Consolidates decisions D1-D182", "Consolidates decisions D1-D187")

# 13.1
rep("singletons are services (activity bus, toasts, notification service, trash collector and guard), each app's gateway and use cases, and each editor's session.",
"singletons are services (activity bus, toasts, notification service, trash collector and guard), the repository and the gateway of each area (each app's review and editor gateway among them) and each editor's session; use cases are transient [D71, D183].")

rep_line("- The shared core lives in `app-workflows` and knows no app:",
"- The shared core lives in `app-workflows` and knows no app: domain types, DTOs, field fragments and mappers of the shared `Workflows*` types, the app gateway contracts (`ReviewAppGateway`, `WorkflowEditorAppGateway`), one use case per operation over one repository and one gateway per area (settings, configuration, editor, review), presenters, views, dialogs, toasts, activity and notification handling, the cache-sync handler, the trash and delete warning flow and the mounting components. There is no namespace registry [D159, D183].")

rep_line("- Each app package (CMS, Website Builder) owns only what differs:",
"- Each app package (CMS, Website Builder) owns only what differs: GraphQL operation documents and the review and editor gateways that run them, registered under the shared `ReviewAppGateway` and `WorkflowEditorAppGateway` tokens, a content adapter, a cache writer and thin glue at app-specific extension points. The app-neutral routing gateways `ReviewGateway` and `WorkflowEditorGateway` pick the app gateway by the review's namespace for review-bound operations and by the app for app-wide ones (the editor, the Content Reviews list and widgets, the workflow list); use cases, repositories and the workflow-list cache exist once, and no use case is passed at runtime (mounts pass `app` or `namespace`). Presenters depend on the use cases they call, never on a repository or a gateway; no logic is duplicated across the app packages [D159, D183, D184]. The shared configuration lookups (step types, automation definitions, notification transports, teams, users, AI models, AI tools) are their own area with one `WorkflowConfigGateway`, one `WorkflowConfigRepository` and one use case each, used by the editor and the settings page; the settings page (13.6) has its own `WorkflowSettingsGateway` and `WorkflowSettingsRepository` with `GetWorkflowSettingsUseCase` and `UpdateWorkflowSettingsUseCase` [D132, D133, D166, D178, D187].")

rep_line("- Gateways return the `{ data, error }` envelope;",
"- App gateways return the `{ data, error }` envelope and reject only on a transport failure; the area gateway (for review and editor, the routing gateway), not the use cases, turns `error` or missing data into a typed `GraphQLOperationError` (`@webiny/app`) that keeps `code`, `message` and `data`, through one helper, and lets a transport error pass; `getTargetReview` and `getStepRun` return `null` for null data and `folderExists` accepts `false`. Presenters map by code. The base CMS and Website Builder delete gateways throw the same error [D157, D183, D184].")

rep("Each app loads its workflow list once and caches it per namespace;", "The workflow list is loaded once per app and cached in `ReviewRepository`, and storing or deleting a workflow clears that app's list [D185];")
p.write_text(t)
PY
```

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

def add_after_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines.insert(hits[0] + 1, new)
    t = "\n".join(lines)

rep("D1-D182", "D1-D187")

ROW = "| Admin layers. Admin data layer per operation | **Built** (plan `docs/.bruno/plans/2026-10-19-workflows-admin-layers/`, five sub-phases: settings, configuration, editor, review, cleanup and docs): the three workflows admin packages follow presenter → use case → area repository → area gateway (D183); 32 use cases, one per operation, live once in `app-workflows`; one repository and one gateway per area, with the configuration lookups as their own area (D187); CMS and Website Builder register only their review and editor gateways under the shared `ReviewAppGateway` and `WorkflowEditorAppGateway` tokens, and the routing `ReviewGateway` and `WorkflowEditorGateway` pick one by the review's namespace or by the app (D184); the workflow-list cache moved into `ReviewRepository` and the store and delete use cases clear it (D185); presenters, services and decorators inject exactly the use cases they call and nothing passes use cases at runtime; the tests follow the layers with one fake per injected use case (D186); the old use-case bundles, their fakes, the per-app use-case tokens and subclasses and the bridges are deleted. No user-visible change and no API change. **Not built:** a global (cross-app) Content Reviews list, use-case decorators | 8a, 8b, 9a, 9b, 9c | 13.1 |"
add_after_line("| 9c. Admin: settings, permissions", ROW)
p.write_text(t)
PY
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c|Admin layers)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
```

The awk line prints `6` seven times (the table keeps its column count; the row text has no `|`).

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

def rep_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines[hits[0]] = new
    t = "\n".join(lines)

def add_after_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines.insert(hits[0] + 1, new)
    t = "\n".join(lines)

# intro
rep("phases 8a, 8b, 9a, 9b and 9c (2026-10-16 to 2026-10-19, D157-D182); section 3 is", "phases 8a, 8b, 9a, 9b and 9c and the admin layers refactor (2026-10-16 to 2026-10-19, D157-D187); section 2 holds the data layer of that refactor, section 3 is")

# section 1: layout
add_after_line("  - The settings area, `settings/` (section 3a)",
"  - The shared data-layer pieces of the admin layers refactor (section 2, D183-D187): `gateway/toOperationError.ts` (the one envelope-error helper), `domain/WorkflowAppKind.ts` (`\"cms\" | \"wb\"`, the routing key of app-wide operations) and the configuration area `config/` (`gateway/` with `WorkflowConfigGateway`, `repository/` with `WorkflowConfigRepository`, `useCases/` with one folder per lookup, `feature.ts` with `WorkflowConfigServicesFeature`), used by the editor and the settings page (D187).")
rep_line("  - The shared review core, `review/`:",
"  - The shared review core, `review/`: `domain/` (types, enums, error codes, constants, pure functions, `ReviewListPage`), `appGateway/` (the multi-registration token `ReviewAppGateway` each app registers its review gateway under, and its contract `IReviewAppGateway` with the wire parameter types), `gateway/` (the routing `ReviewGateway`, DTOs, field fragments, mappers), `repository/` (`ReviewRepository` with the per-app workflow-list cache, `ReviewRepositoryFeature`), `useCases/` (one folder per operation: `getBoundWorkflow`, `getTargetReview`, `getReview`, `listStepCandidates`, `listReviewStepCandidates`, `getStepRun`, `listReviews`, `requestReview`, `startReviewStep`, `takeOverReviewStep`, `reassignReviewStep`, `approveReviewStep`, `rejectReviewStep`, `cancelReview`, `restartReviewStep`, `cancelReviewsForDelete`, `listBlockingReviews`), `events/`, `cache/`, `activity/`, `toasts/`, `notifications/`, `content/` (the content adapter interface), `presentation/{targetReview,actionDialog,reviewerPicker,requestReview,reviewDetails,reviewList,reviewWidget}/`, `editor/` (editor session and `EditorReviewBar`), `mounting/` (row provider, notification handler, route, menu and widget components), `trash/` (block collector, guard, warning presenter and dialog), `testing/` (fixtures and wiring helpers), `feature.ts`.")
rep("the review core (use-case and gateway types, `ReviewUseCases`, `EditorReviewSession`,", "the review core (the use-case abstractions, `ReviewAppGateway`, `EditorReviewSession`,")
rep("`WorkflowEditorAppAdapter`, the editor use-case interfaces) is imported the same way", "`WorkflowEditorAppAdapter`, `WorkflowEditorAppGateway`) is imported the same way")

# section 2
rep_line("- Layering (D159):",
"- Layering (D183, D184; refines D159): presenter → use case → area repository → area gateway. Each operation is one use case (`<Name>UseCase`, one `execute`, transient, the decoration point) in `useCases/<operation>/` of its area (`abstractions.ts` with the interface, the `Params` type, the token `Workflows/<Name>UseCase` and the namespace; `<Name>UseCase.ts`; `feature.ts` with `<Name>Feature`), once in `app-workflows`. Each area has one repository (singleton: maps DTOs to domain types, owns the area's cache) and one gateway (singleton: runs or routes the call, converts the error, returns DTOs): settings `WorkflowSettingsRepository` / `WorkflowSettingsGateway`, configuration `WorkflowConfigRepository` / `WorkflowConfigGateway`, editor `WorkflowEditorRepository` / `WorkflowEditorGateway`, review `ReviewRepository` / `ReviewGateway`; `<Area>RepositoryFeature` registers the pair and the area's services feature registers it with every use-case feature of the area (`WorkflowSettingsServicesFeature`, `WorkflowConfigServicesFeature`, `WorkflowEditorServicesFeature`, `ReviewServicesFeature`). Only the review and editor gateways differ per app: each app registers its gateway (`CmsReviewGateway`, `WbReviewGateway`, `CmsWorkflowEditorGateway`, `WbWorkflowEditorGateway`; they keep the R204 envelope contract) under the shared multi-registration token `ReviewAppGateway` or `WorkflowEditorAppGateway` with its `app` (`cms`, `wb`) and, for review, `canHandle(namespace)` (CMS `cms.<modelId>`, WB `wb.page`). The routing `ReviewGateway` and `WorkflowEditorGateway` take every registration (`[[Token, { multiple: true }]]`) and pick the first claimant per call: review-bound operations by the review's namespace, app-wide operations (every editor operation, `listReviews`, the workflow list) by `app`; the app gateway receives exactly its old parameters. A namespace or app nobody claims throws a plain `Error` (\"No workflows app handles the namespace \"x\".\", \"No workflows app is registered for \"x\".\"). Presenters, services and decorators inject exactly the use cases they call; no use case travels through `init()`, props, the row binding or the editor session, mounts pass `app` (`WorkflowAppKind`) or `namespace`. The routing gateways collect the app gateways when first built and the three roots register in the plugin pass before any route renders, so no plugin-pass component resolves a use case, a repository or a routing gateway (R349). The R237 subclass rule now applies only to `AppReviewRowProvider`, `EditorReviewSession`, `ReviewNotificationHandler`, `ReviewChangeMessageHandler` and `ReviewCacheSyncHandler`.")
rep_line("- Errors: gateways return the `{ data, error }` envelope;",
"- Errors (D183): app gateways return the `{ data, error }` envelope and reject only on a transport failure; the area gateway (for review and editor, the routing gateway) throws `GraphQLOperationError` (`@webiny/app/errors/GraphQLOperationError.ts`, code, message, data) through the one helper `toOperationError` (`[AW]/gateway/`; \"The request failed.\" when the server sends no message) for an error or missing data, except `getTargetReview` and `getStepRun` (null data is a value) and `folderExists` (`false` is a value); a transport error and a plain `Error` from an app gateway pass unchanged. Repositories never swallow an error; only the store and delete use cases catch, to clear the workflow list after `NotFound` and rethrow (D185). Presenters map by code (\"Someone else acted first\", field errors, no access, transport failure).")
rep("and `createFakeActivity` (a fake activity bus).", "and `createFakeActivity` (a fake activity bus). Since the admin layers refactor (D186) the tests follow the layers: gateway tests run the real gateway over a fake `MainGraphQLClient`, routing tests use two fake app gateways under the shared token, use-case tests use a fake area gateway with the real repository (and cache), and presenter and decorator tests register one `{ execute: vi.fn() }` fake per injected use case; the setup kits (`editorPresenterSetup`, `exclusionsPageSetup`, `exclusionDialogSetup`, the CMS `testing/createEntrySession.ts`, the WB `testing/createFakeSession.ts`) register those fakes and return them by use-case name, over the shared factories `config/testing/fakeList<Name>UseCase.ts`, `review/testing/{createReviewUseCaseFakes,registerReviewUseCaseFakes,createTrashUseCaseFakes,registerTrashUseCaseFakes}.ts`; the routing tests use `createFakeReviewAppGateway` and the review use-case tests `createFakeReviewGateway`. There are no aggregate fakes.")

# section 3
rep("whose `resolve` returns `{ useCases, reviewUseCases, app }`; these are passed to the view as props and on to `WorkflowEditorPresenter.init`.", "whose `resolve` returns `{ app }`, which is passed to the view as a prop and on to `WorkflowEditorPresenter.init`; the presenter injects its use cases and sends `app.appKind` as their routing key (D184).")
rep_line("- Gateways and use cases: `IWorkflowEditorGateway",
"- Gateways, repository and use cases (D183, D184, D187): each app's editor gateway (`CmsWorkflowEditorGateway` in `[CMS]/features/editorGateway/` over the `cms` root, `WbWorkflowEditorGateway` in `[WB]/features/editorGateway/` over `websiteBuilder`; the WB `listModels` returns the single `wb.page` row `Pages` with its bound workflow from `listWebsiteBuilderPageWorkflows`, and WB ignores `modelId` and the folder type) implements `IWorkflowEditorAppGateway` (`[AWE]/appGateway/`: `app` and `listModels`, `getWorkflow`, `storeWorkflow`, `deleteWorkflow`, `inspectRouting`, `folderExists`, each resolving with the envelope) and is registered under `WorkflowEditorAppGateway` by `CmsWorkflowEditorFeature` / `WbWorkflowEditorFeature`. The routing `WorkflowEditorGateway` (`[AWE]/gateway/`) picks it by `app` and unwraps the envelope; `WorkflowEditorRepository` (`[AWE]/repository/`) maps the DTOs to the domain types (`EditorWorkflow`, `EditorStep`, `WorkflowModelRow`, ...); the six use cases are `ListWorkflowModelsUseCase`, `GetWorkflowUseCase`, `StoreWorkflowUseCase`, `DeleteWorkflowUseCase`, `InspectRoutingUseCase` and `FolderExistsUseCase` (`[AWE]/useCases/<operation>/`), each taking `app` beside its old parameters, registered by `WorkflowEditorServicesFeature`. The configuration lookups are their own area, `[AW]/config/` (D187): `WorkflowConfigGateway` (one implementation over `MainGraphQLClient` on the `workflows` root), `WorkflowConfigRepository` and the use cases `ListStepTypesUseCase`, `ListAutomationDefinitionsUseCase`, `ListNotificationTransportsUseCase`, `ListWorkflowTeamsUseCase`, `ListWorkflowUsersUseCase` (`{ search, ids, teamIds, limit }`, D170), `ListAiModelsUseCase` and `ListAiToolsUseCase` (the last two are called only when the AI type is available), registered by `WorkflowConfigServicesFeature`. The DTOs, field fragments and mappers stay in `[AWE]/gateway/`.")
rep("After a save and after a delete the presenter calls `reviewUseCases.invalidateWorkflows()` (R277), which clears the shared `ReviewUseCases` cached workflow list including a pending load.", "After a save or a delete, `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` clear the app's cached workflow list in `ReviewRepository`, also after a `NotFound` answer, and a load in flight does not refill it; the presenter no longer does it (R277, D185).")

# section 3a
rep_line("- Services: `WorkflowSettingsGateway`",
"- Services (D183): `WorkflowSettingsGateway` (`[AWS]/gateway/`: `getSettings(params)` and `updateSettings(data)` on the shared `workflows` root; it throws `GraphQLOperationError` for an envelope error and returns the DTO) and `WorkflowSettingsRepository` (`[AWS]/repository/`: maps with `mapWorkflowSettings` and `toWorkflowSettingsDto`), both singletons of `WorkflowSettingsRepositoryFeature`, and the use cases `GetWorkflowSettingsUseCase` (always `includeExpired: true`, because a save replaces the whole record) and `UpdateWorkflowSettingsUseCase` (`[AWS]/useCases/<operation>/`), registered by `WorkflowSettingsServicesFeature` (`[AWS]/feature.ts`). User names and the user search use `ListWorkflowUsersUseCase` of the configuration area; there is no settings copy of it. The domain keeps `reason` and `endsOn` as `string | null`.")

# section 4
rep("one `IEditorReviewSession { presenter, useCases }` per app", "one `IEditorReviewSession { presenter }` per app")
rep("`EditorReviewBar` renders `ReviewBar` and the details drawer.", "`EditorReviewBar` renders `ReviewBar` and the details drawer and passes them the review's namespace (`session.presenter.vm.namespace`).")
rep("`ReviewListPresenter` over `IReviewListUseCases` and an `IReviewRowProvider` (app-neutral rows, per-namespace link and actions);", "`ReviewListPresenter` over `ListReviewsUseCase` (initialised with its `app`) and an `IReviewRowProvider` (app-neutral rows, per-namespace link and content type; a row's dialogs get the row's `namespace`);")
rep("widgets: `ReviewWidgetPresenter` with", "widgets: `ReviewWidgetPresenter` (also over `ListReviewsUseCase` and an `app`) with")
rep("- Trash and delete: `ActiveReviewGuard` (`run`, `runBulk`)", "- Trash and delete: `ActiveReviewGuard` (`run`, `runBulk`, over `CancelReviewsForDeleteUseCase`)")
rep("the bulk decorator asks `listBlockingReviews` per chunk", "the bulk decorator asks `ListBlockingReviewsUseCase` per chunk")

# section 5
rep("`listAiModels`, `listAiTools`) go through one `WorkflowConfigGateway`.", "`listAiModels`, `listAiTools`) go through one `WorkflowConfigGateway` (`[AW]/config/gateway/`, D187).")
rep("the names come from the configuration use cases' `listUsers`.", "the names come from `ListWorkflowUsersUseCase`.")

# section 6
rep_line("CMS and WB use: `ReviewUseCases` through their own tokens,",
"CMS and WB use: `ReviewAppGateway` and `WorkflowEditorAppGateway`, under which each registers its review and editor gateway (D184), `EditorReviewSession` and `EditorReviewBar`, the presenters' `init` arguments (a target, a namespace or an `app`, never a use case), `ReviewListView` and the widgets through the mounting components (`app=\"cms\"`, `app=\"wb\"`), `ReviewCacheSyncHandler` with their cache writer, `ReviewNotificationHandler` and `ReviewChangeMessageHandler` subclasses with their content adapter, an `IReviewContentReloader` passed to `TargetReviewPresenter.init` as `contentReloader`, `ActiveReviewGuard` (`run`, `runBulk`, `confirmBlocking`; the CMS bulk decorator also injects `ListBlockingReviewsUseCase`), and, for the editor, `WorkflowEditorView` with a per-app `WorkflowEditorAppAdapter`, plus `useWorkflowsPermission` for the editor gate. The `system.workflow` shape on content is `{ workflowId, reviewState, stepId, stepName, stepState }` (`SystemWorkflowValue`). Details in `integrations.md`.")

# section 9
add_after_line("- Not planned: several workflows per model, secret settings.",
"- Admin layers (D183-D187), not built: a global (cross-app) Content Reviews list (the routing gateway makes it possible) and use-case decorators (the use cases are only the decoration point).")
p.write_text(t)
PY
```

If Step 1 shows a different name for a token, a feature, a folder or a kit (the use-case and feature names, `WorkflowAppKind`, `ReviewListPage`, `IReviewAppGateway`, `IWorkflowEditorAppGateway`, the composite features, the five kits and the fake factories), use the as-built name. A bug found on the way and left (Step 1b, kind 2) is appended to the section 9 bullet the script adds.

**6b. `integrations.md`.**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/integrations.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

rep("`CmsReviewGateway` (GraphQL documents over the `cms` root), `CmsReviewUseCases` (`CmsReviewUseCasesImpl`, a subclass of the shared `ReviewUseCases` bound to that gateway, singleton), `CmsReviewContentAdapter`", "`CmsReviewGateway` (GraphQL documents over the `cms` root; singleton, registered under the shared `ReviewAppGateway` token with `app` `cms` and `canHandle` true for `cms.<modelId>`, so the shared use cases reach it through the routing `ReviewGateway`, D184), `CmsReviewContentAdapter`")
rep("for all loaded rows the decorator pre-checks with `listBlockingReviews` per chunk", "for all loaded rows the decorator pre-checks with `ListBlockingReviewsUseCase` per chunk")
rep("(`CmsWorkflowEditorGateway` with the four documents over the `cms` root, `CmsWorkflowEditorUseCases` with the subclass `CmsWorkflowEditorUseCasesImpl`, registered from the package root)", "(`CmsWorkflowEditorGateway` with the documents over the `cms` root, registered by `CmsWorkflowEditorFeature` under the shared `WorkflowEditorAppGateway` token with `app` `cms`, D184)")
rep("`CmsWorkflowEditorMountingFeature`, which resolves the use cases, the `CmsReviewUseCases` and the adapter)", "`CmsWorkflowEditorMountingFeature`, which resolves only the adapter, as `app`)")
rep("`WbReviewGateway` (documents over the `websiteBuilder` root), `WbReviewUseCases`, `WbReviewContentAdapter`", "`WbReviewGateway` (documents over the `websiteBuilder` root; singleton, registered under `ReviewAppGateway` with `app` `wb` and `canHandle` true for `wb.page`; its `listBlockingReviews` returns an empty list without a request), `WbReviewContentAdapter`")
rep("(the WB mirror of the CMS gateway and use cases; `listModels` returns the single `wb.page` row `Pages`)", "(the WB mirror of the CMS editor gateway, under `WorkflowEditorAppGateway` with `app` `wb`; `listModels` returns the single `wb.page` row `Pages`)")
rep("with its own `WorkflowEditorAppAdapter` and editor use cases (see `app.md` section 3).", "with its own `WorkflowEditorAppAdapter`; the editor use cases are shared, and each app registers its editor gateway under `WorkflowEditorAppGateway` (D184; see `app.md` section 3).")
p.write_text(t)
PY
```

**6c. `README.md`.**

```bash
python3 -I - <<'PY'
import pathlib
p = pathlib.Path("docs/.bruno/workflows/README.md")
t = p.read_text()

def rep(old, new):
    global t
    assert t.count(old) == 1, old[:70]
    t = t.replace(old, new)

def add_after_line(prefix, new):
    global t
    lines = t.split("\n")
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, prefix
    lines.insert(hits[0] + 1, new)
    t = "\n".join(lines)

rep("it describes the code after phase 9c.", "it describes the code after phase 9c and the admin layers refactor.")
rep("as built in phases 8a, 8b, 9a, 9b and 9c (shared review core, per-app gateways and glue,", "as built in phases 8a, 8b, 9a, 9b and 9c and the admin layers refactor (shared review core, the data layer of use cases, area repositories and gateways with per-app gateways behind routing gateways, glue,")
add_after_line("| 9c | Reviewer exclusions settings page", "| Admin layers | The admin data layer per operation: one use case per operation, one repository and one gateway per area, per-app gateways behind routing gateways, the workflow-list cache in `ReviewRepository`, tests by layer | `plans/2026-10-19-workflows-admin-layers/` |")
p.write_text(t)
PY
awk -F'|' '/^\| [0-9a-zA-Z]/ {print NF}' docs/.bruno/workflows/README.md | sort | uniq -c
```

The awk line prints `7 4` and `17 5` (at BASE `7 4` and `16 5`: the phase table has three columns, and the new row adds one `5` and no stray `|`). If an `old` text is not found because a sentence was reworded, find it (`grep -n "9c" docs/.bruno/workflows/README.md`) and change the `old` string, not the intent.

- [ ] **Step 7: Final greps (the proof)**

```bash
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -rnE "ReviewUseCases|WorkflowEditorUseCases|WorkflowConfigUseCases|WorkflowSettingsUseCases|IReviewListUseCases|IReviewReadUseCases|reviewUseCases|useCases[ ,}\`]|invalidateWorkflows\(\)|createFakeUseCases" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/workflows/README.md docs/.bruno/workflows/decisions.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -d: -f1,2
grep -rnE "use-case token|gateway and use cases|per-app (editor )?use cases|use-case interfaces|editor use cases \(" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md | cut -d: -f1,2
grep -rn "D1-D182\|D157-D182" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md docs/.bruno/workflows/app.md | cut -c1-90
grep -n "^## D18[3-7]\." docs/.bruno/workflows/decisions.md
grep -c "Refined by D183 and D184" docs/.bruno/workflows/decisions.md
grep -n "D1-D187" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-70
grep -n "^| Admin layers" docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md docs/.bruno/workflows/README.md | cut -c1-80
grep -n "D157-D187\|Admin layers (D183-D187)" docs/.bruno/workflows/app.md | cut -c1-60
grep -c "ReviewAppGateway" docs/.bruno/workflows/app.md docs/.bruno/workflows/integrations.md docs/.bruno/specs/2026-10-05-workflows-refactor-design.md
awk -F'|' '/^\| (7|8a|8b|9a|9b|9c|Admin layers)\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
git diff --stat | tail -8
```

Expected (each was produced by running Steps 3-6 on a copy of the BASE docs): the first grep prints nothing; the second prints exactly two `decisions.md` lines, the D159 body (historical, kept) and the D159 note (which says the bundles are gone); the third prints nothing; the fourth prints nothing; the fifth prints the five headings D183-D187; the sixth prints `1`; the seventh shows the spec status line and the roadmap header; the eighth prints the roadmap row and the README row; the ninth prints the `app.md` intro line and the section 9 bullet; the tenth prints a non-zero count for each of the three files; the awk line prints `6` seven times; `git diff --stat` lists only the six docs files of this task.

- [ ] **Step 8: Pre-commit chain and commit**

Docs only: no package source or `package.json` changes in this task, so `yarn adio`, `yarn check-ts-configs` and the builds have nothing to prove; they still run as part of the chain. `docs/` is ignored by the formatter.

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

`git status --short` must list only the docs files of this task (`decisions.md`, the spec, the roadmap, `app.md`, `integrations.md`, `README.md`) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then (one line per recorded execution ruling and per corrected name in the third `-m`, or `none`):

```bash
git commit -m "docs(workflows): record the admin layers refactor (D183-D187), spec 13.1, the roadmap and the guides as built" -m "Adds D183 (admin data layer per operation), D184 (per-app gateways behind a routing gateway), D185 (the workflow list is cached in ReviewRepository), D186 (workflows admin tests follow the layers) and D187 (configuration is its own area), adds the refinement note to D159, updates the spec status line and 13.1, adds the roadmap row Admin layers as built, and updates app.md (sections 1 to 6 and 9), integrations.md and README.md for the as-built data layer." -m "Execution rulings recorded: <one line each, or none>. Names corrected against the code: <one line each, or none>." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. R359 lists `decisions.md`, `app.md` (sections 1, 2, 3, 3a, 4 and the consumer paragraph), the spec 13.1 and the roadmap. This task also edits `integrations.md` (lines 33, 37, 38, 43, 47 and 92 at BASE name `CmsReviewUseCases`, `WbReviewUseCases`, the per-app editor use-case subclasses, the mounting features' use-case resolve and the CMS pre-check through `listBlockingReviews`) and `README.md` (its map sentence, its `app.md` line and its phase table end at 9c), `app.md`'s intro, section 5 (the configuration gateway's home and the settings names source) and section 9 (what the refactor did not build, from "Not in this phase" of the contract). Without these the docs would contradict the code, as in the 9c docs task.
2. R359 and the Task 15 entry give spec 13.1 as "lines 511-512" and "511-513". At BASE the shared-core bullet is line 510, the per-app bullet 511 and the envelope bullet 512; the script edits all three by their text, plus the singletons sentence of the first 13.1 bullet ("each app's gateway and use cases") and the workflow-list sentence of the flag bullet ("caches it per namespace"), which would otherwise contradict D184 and D185.
3. R359 asks to mark "R237's data-layer use as refined by D184". R237 is a ruling in `../../2026-10-16-workflows-phase-8a/00-shared.md`, not a decision; `decisions.md` records it only inside D159 ("... binds the subclass under its own token (R237)"). The note is therefore on D159, and it states R237's narrower scope and the R243 fakes (D186) in the same place. D184 and D186 also carry "**Refines** ... R237" and "R243" as the contract says.
4. The contract's "Spec and sources" names D165 among the decisions this plan refines; nothing in this plan changes D165 (validation errors point at the step and field) and `decisions.md` has no statement about the bundles outside D159 (Step 2's grep), so no note is added to D165.
5. The decision texts expand the contract's "Decisions" entries with the as-built names and rules of R343-R364 (tokens, features, routing keys, error messages, cache semantics, the kits); Step 1 checks every name, and the "Covers" lines name the rulings each decision records (D183: R342-R344, R346, R351, R352, R354, R360; D184: R345, R347-R349, R353, R356, R358, R361-R363; D185: R350, R351; D186: R355; D187: R344, R354, R364).
6. Every name in the scripts is the contract's; the other task files of this plan were written in parallel, so Step 1 checks each and a renamed one is corrected in the doc and listed in the report. The execution ledger's location is not fixed by the contract; Step 1b finds it.

**Review fixes (sub-phase review):**
1. D186 and `app.md` section 2: `targetReviewFakes` is not a use-case kit (Task 10: it holds no use-case wiring and is unchanged), so it left the list of kits; the shared per-use-case fake factories of Tasks 4, 7, 8, 11 and 13 (`config/testing/fakeList<Name>UseCase.ts`, `createReviewUseCaseFakes` / `registerReviewUseCaseFakes`, `createTrashUseCaseFakes` / `registerTrashUseCaseFakes`, `createFakeReviewAppGateway`, `createFakeReviewGateway`) are named instead; Step 1's `ls` and expected output and the Step 6a name note follow.
2. D159 note and `app.md` section 2: the R237 subclass rule still covers `ReviewNotificationHandler` (8a R223), which the list left out.
3. D183 and `app.md` section 2: "one `execute(params)`" became "one `execute`" (`GetWorkflowSettingsUseCase.execute()` takes no parameter, Task 1).
4. Step 1 expected output: the "No workflows app" grep prints three lines (the namespace and the app message of `ReviewGateway.ts`, Task 7, and the app message of `WorkflowEditorGateway.ts`, Task 5), not two.
