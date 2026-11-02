### Task 9: `WorkflowEditorPresenter` core (shell, options, model list)

R234, R268 (team names and counts), R269, R275, R279, R280, R281, R284; D92, D116, D162; Q43; QBZ-17, QBZ-20; Review Focus 6, 9, 10 (`00-shared.md`). The phase 9a Global Constraints, the 8b Global Constraints and the 8a Global Constraints and Rulings R202-R252 apply unchanged (read: presenters own state with render-ready VMs, transient presenters with `dispose()` that resets, inline `try`/`catch` around use-case calls, no helper that wraps a dependency call, no stateless private methods, one abstraction or feature per file, one named import per line, no inline object types, comments end with a period, targeted tests, the pre-commit chain).

This task builds the editor presenter's shell: it initialises the editor (permission gate, adapter init, options load), runs the model list (server search, load more, select), loads the bound workflow into the `WorkflowDraft` of Task 8, resolves the step team names, asks before switching away from a dirty draft, and exposes the render-ready VM of the panel, header and empty state. Task 9b adds everything about steps (create, add, move, delete, the type picker, the step cards, the drawer accessors, `openStep`, the team search); Task 10 adds save and delete. The presenter owns the draft and every list; the view gets only the render-ready VM.

- **Contract names and where this task deviates.** `WorkflowEditorInitParams { useCases: IWorkflowEditorUseCases; reviewUseCases: IReviewReadUseCases; app: WorkflowEditorAppAdapter }`, the token `WorkflowEditorPresenter` and `WorkflowEditorPresenterFeature` are the contract's. The member names the view tasks already use are kept: Task 15 reads `vm.status`, `vm.error`, `vm.panel { label, showSearch, search, rows[{ modelId, name, subLine, bound, unsaved, active }], loading, loadingMore, hasMore, emptyText }`, `vm.header { name, nameError, appliesTo, dirty, saving, canSave, canDelete }`, `vm.empty { title, description }` and calls `retry`, `setSearch`, `loadMore`, `selectModel(modelId)`. A model row is keyed by its `modelId` (`article`), which is also what `app.renderModelIcon(modelId)` takes (the view calls the adapter, so the VM stays free of it, R234); the draft's `models` hold the namespace (`cms.article`).
- **Init (R279, D162, R280, R281).** `init(params)` first calls `dispose()`, then reads `getWorkflowsPermissionSet(identity).editor`: without it `vm.status` is `noAccess` and nothing is loaded. Otherwise `await params.app.init()` (the CMS adapter fills the admin `ModelsCache`, so the row icons exist; a rejected `init` does not block the editor, it only leaves the icons empty, because a workflows editor may lack the CMS model permissions), then the first model page (`listModels({ search: "", limit: 20, after: null })`) and the option lists in parallel; `vm.status` is `ready` once the first page arrived and `failed` (with `vm.error` the failure's message) when the page failed; `retry()` runs `init` again. Then the first row opens (`selectModel`), so the right side is never undefined (no design copy exists for "no model chosen"; for the WB the single row `Pages` opens).
- **Options per list (R269, R275, R281, R284).** `getOptions()` answers `WorkflowEditorOptions`: `stepTypes`, `automations`, `transports`, `aiModels` and `aiTools`, each an `OptionList<T> { status: "loading" | "ready" | "failed"; items }`. `listStepTypes`, `listAutomationDefinitions` and `listNotificationTransports` load together; `listAiModels` and `listAiTools` load only when `isAiEditable(stepTypes.items)` (the `ai` row is available and has a `configSchema`, else the field may not exist on the server): otherwise they are not requested and are `ready` with no items, never `loading` and never `failed`. A failed list is `failed` with no items and the others keep their own status; an empty list that loaded is `ready`, so an empty list is never shown as a failure. Every list is `loading` from the start of a (re)load. Any `failed` list sets the banner `vm.optionsBanner` (`Could not load the step options.`); `retryOptions()` reloads every list and the team names.
- **Model list (R280, QBZ-20).** `setSearch(search)` updates `vm.panel.search` at once and, 250 ms after the last call, restarts at the first page with that search (the rows are replaced, a stale response of an older search or of a load more is dropped by a token). `loadMore()` appends the next page while `hasMore`. `vm.panel.emptyText` is `No models match “{q}”.` for a search with no row. A failed search or load-more sets `vm.panel.error` (`Could not load workflows`) and `retryModels()` reloads the first page. The WB adapter has `appKind: "wb"`, so `vm.panel.showSearch` is false. The sub line of a row is `{n} steps` (`1 step`) for the open model's loaded workflow, the bound workflow's name for another bound row (deviation, QBZ-20 forbids counts per row, R280) and `No workflow` otherwise; `bound` is true when the row has a workflow, `unsaved` is true for the open model while the draft is dirty. A search can drop the open model's row from the list; the draft stays and only the row's dot is gone (accepted).
- **Open a model (R279).** `selectModel(modelId)` is a no-op for the open model. With a dirty draft it opens the dialog `Discard unsaved changes?` (the VM below) and waits: `confirmDialog()` discards and opens the model, `cancelDialog()` keeps editing; both do nothing while the dialog is busy. Otherwise it loads the model's bound workflow with `getWorkflow(id)` (a stale response is dropped), resets the draft to it and resolves the step team names. A model without a workflow shows `vm.empty` (`{Model} has no workflow` / `Add a workflow to require a review before {Model} content can be published.`). A `NotFound` for the bound workflow (deleted meanwhile) unbinds the row and shows the same empty state; any other failure sets `vm.status` to `failed` (Task 15 has no inline state for a workflow that did not load, so the page-level load error with `Try again` is reused; `retry()` re-initialises and reopens that model when it is on the first page).
- **Team names (R268, Review Focus 9).** After a workflow loads, the presenter collects the distinct team ids of its People steps and of the `ui: "team"` settings of its automation steps (`collectTeamIds(steps, automations)`, Task 14's drawer feeds the same settings, R284) and calls `listTeams({ search: null, ids, limit: null })` once (at most 200 ids, the server's cap; ids already known are not asked again) so the card summaries (Task 9b) and the `{Team} has no members.` warnings have names and counts; the result fills `teamsKnown`. A lookup failure shows the options banner.
- **Dialog VM.** `vm.dialog: WorkflowEditorDialogVm | null` is the one dialog the presenters share (the contract; Task 18 renders it, Tasks 9b, 10 and 14 add kinds). This task defines the VM shape with every field the later dialogs need (`kind`, `title`, `body`, `note`, `reviews`, `confirmLabel`, `cancelLabel`, `destructive`, `cancelDestructive`, `busy`) and the kind `discardChanges`. The texts are built when the dialog opens and kept in a `PendingDialog { vm, action }`; `confirmDialog()` runs the action, `cancelDialog()` is the secondary button.
- **Registration.** `WorkflowEditorPresenterFeature` is registered by `WorkflowsAdminApp` inside the flag gate. The old editor's `WorkflowsEditorPresenterFeature` (token `WorkflowsEditorPresenter`, one letter different) stays until Task 22; do not import it.

**Files:** (all under `packages/app-workflows/src`)
- Create: `editor/WorkflowEditorAppAdapter.ts`
- Create: `editor/presentation/editor/constants.ts`
- Create: `editor/presentation/editor/abstractions.ts`
- Create: `editor/presentation/editor/optionLists.ts`
- Create: `editor/presentation/editor/PendingDialog.ts`
- Create: `editor/presentation/editor/dialogs/discardChangesDialog.ts`
- Create: `editor/model/getTeamSettingKeys.ts`
- Create: `editor/presentation/editor/collectTeamIds.ts`
- Create: `editor/presentation/editor/buildModelRowVms.ts`
- Create: `editor/presentation/editor/WorkflowEditorPresenter.ts`
- Create: `editor/presentation/editor/feature.ts`
- Create: `editor/testing/fakeEditorAppAdapter.ts`
- Create: `editor/testing/editorPresenterSetup.ts`
- Create (tests): `editor/model/getTeamSettingKeys.test.ts`, `editor/presentation/editor/optionLists.test.ts`, `editor/presentation/editor/collectTeamIds.test.ts`, `editor/presentation/editor/buildModelRowVms.test.ts`, `editor/presentation/editor/dialogs/dialogs.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.init.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.models.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts`
- Modify: `app.tsx`, `app.test.tsx`

**Interfaces:**
- Consumes: Task 6 (`createDeferred` from `~/editor/testing/createDeferred.js`), Task 5 (`IWorkflowEditorUseCases` with `listModels(params): Promise<WorkflowModelPage>`, `getWorkflow(id): Promise<EditorWorkflow>`, `storeWorkflow`, `deleteWorkflow`; `WorkflowConfigUseCases` token with `listStepTypes`, `listAutomationDefinitions`, `listNotificationTransports`, `listTeams(params: ListTeamsParams)`, `listAiModels`, `listAiTools`; the domain types of `~/editor/domain/types.js`; `WorkflowErrorCode`; the fixtures `editorFixtures.ts` and the fakes `createFakeEditorUseCases`, `createFakeConfigUseCases`, `createFakeEditorToasts`; `WorkflowEditorToasts` token and `WorkflowEditorServicesFeature`, which Task 5c's `app.test.tsx` `mount` already supports with a `MainGraphQLClient` instance), Task 6 (`IReviewReadUseCases`; `createFakeUseCases` in `~/review/testing/fakeReviewUseCases.js`), Task 8 (`WorkflowDraft`, `isAiEditable`, the fixtures `draftFixtures.ts`). Existing (verified): `GraphQLOperationError` (`@webiny/app/errors/index.js`, `code` and `data` default to null), `IdentityContext` (`@webiny/app-admin/features/security/IdentityContext/abstractions.js`, `getIdentity()`), `getWorkflowsPermissionSet` (`~/review/domain/getWorkflowsPermissionSet.js`), `IReviewContentAdapter` (`~/review/content/IReviewContentAdapter.js`), `createWorkflowsIdentityContext` (`~/review/testing/createWorkflowsIdentityContext.js`), `createAbstraction` and `createFeature` (`@webiny/feature/admin`), `mobx` `makeAutoObservable` and `observableRef`.
- Produces: `WorkflowEditorPresenter` (token, `WorkflowEditorPresenter.Interface` and `.ViewModel`), `WorkflowEditorInitParams`, `WorkflowEditorPresenterFeature` (`resolve` returns `{ presenter }`, transient), `WorkflowEditorAppAdapter` (`appKind`, `panelLabel`, `appliesToLabel`, `init`, `renderModelIcon`, `contentAdapter`; Tasks 20 and 21 implement it), the view model types (`IWorkflowEditorViewModel`, `ModelPanelVm`, `ModelRowVm`, `WorkflowHeaderVm`, `EmptyWorkflowVm`, `OptionsBannerVm`, `DialogReviewVm`, `WorkflowEditorDialogVm`, `WorkflowEditorDialogKind`), the option types (`OptionList`, `OptionListStatus`, `WorkflowEditorOptions`), `PendingDialog` and `PendingAction`, `createFakeAppAdapter` and `createFakeContentAdapter` (`[AWET]/fakeEditorAppAdapter.ts`, also used by Tasks 20 and 21), and `createEditorPresenterSetup` (Tasks 9b, 10, 14 reuse it). Presenter members: `init`, `retry`, `retryOptions`, `retryModels`, `setSearch`, `loadMore`, `selectModel`, `confirmDialog`, `cancelDialog`, `getOptions`, `dispose`.

**Test runner note:** admin package, `yarn test <path>` only; the tests are co-located `*.test.ts`. One test file per concern keeps each file short; every presenter test file builds its presenter through `createEditorPresenterSetup`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts` (a vitest fake, its own file so the CMS and WB mount tests of Tasks 20 and 21 import it without the presenter setup; it carries the `contentAdapter` fake too):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";

export interface FakeEditorAppAdapter extends WorkflowEditorAppAdapter {
    init: Mock<WorkflowEditorAppAdapter["init"]>;
    renderModelIcon: Mock<WorkflowEditorAppAdapter["renderModelIcon"]>;
}

export const createFakeContentAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: vi.fn().mockReturnValue(true),
        getContentUrl: vi.fn((ref: ReviewContentRef) => {
            return `/content/${ref.targetId}/${ref.targetRevisionId}`;
        }),
        getContentTypeLabel: vi.fn().mockReturnValue(null)
    };
};

export const createFakeAppAdapter = (kind: WorkflowEditorAppKind = "cms"): FakeEditorAppAdapter => {
    return {
        appKind: kind,
        panelLabel: kind === "cms" ? "Content models" : "Website Builder",
        appliesToLabel: kind === "cms" ? "Headless CMS model" : "Website Builder",
        init: vi.fn().mockResolvedValue(undefined),
        renderModelIcon: vi.fn().mockReturnValue(null),
        contentAdapter: createFakeContentAdapter()
    };
};
```

Create `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts` (a vitest and DI support file, separate from the pure builders, R243):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorInitParams } from "~/editor/presentation/editor/abstractions.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { FakeWorkflowEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import type { FakeEditorAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

export interface EditorPresenterSetupOptions {
    // Whether the viewer has the workflows `editor` permission; default true.
    editor?: boolean;
    reassign?: boolean;
    appKind?: WorkflowEditorAppKind;
}

export interface EditorPresenterSetup {
    presenter: WorkflowEditorPresenter.Interface;
    container: Container;
    useCases: FakeWorkflowEditorUseCases;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
    reviewUseCases: FakeReviewUseCases;
    app: FakeEditorAppAdapter;
    params: WorkflowEditorInitParams;
}

/*
 * A presenter with fakes for everything it talks to. Defaults: the viewer is an editor; one model
 * row `Article` bound to the workflow `Article review` with one People step on the team `Editors`
 * (Task 5's fakes); all three step types, the AI editor present with one model and one tool; one
 * automation covering every model; the e-mail transport; one team.
 */
export const createEditorPresenterSetup = (
    options: EditorPresenterSetupOptions = {}
): EditorPresenterSetup => {
    const permission: IPermission = {
        name: "workflows",
        editor: options.editor ?? true,
        reassign: options.reassign ?? false
    };
    const useCases = createFakeEditorUseCases();
    const config = createFakeConfigUseCases();
    config.listStepTypes.mockResolvedValue(createStepTypes());
    config.listAutomationDefinitions.mockResolvedValue([createWebhookAutomation()]);
    config.listAiModels.mockResolvedValue([createAiModel()]);
    config.listAiTools.mockResolvedValue([createAiTool()]);
    config.listTeams.mockResolvedValue({
        teams: [createWorkflowTeamSummary()],
        missingIds: []
    });
    const toasts = createFakeEditorToasts();
    const reviewUseCases = createFakeUseCases();
    const app = createFakeAppAdapter(options.appKind ?? "cms");

    const container = new Container();
    container.registerInstance(
        IdentityContext,
        createWorkflowsIdentityContext({ permissions: [permission] })
    );
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    WorkflowEditorPresenterFeature.register(container);
    const presenter = container.resolve(WorkflowEditorPresenter);

    const params: WorkflowEditorInitParams = { useCases, reviewUseCases, app };

    return { presenter, container, useCases, config, toasts, reviewUseCases, app, params };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/optionLists.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createOptionList } from "./optionLists.js";
import { toOptionList } from "./optionLists.js";

describe("optionLists (R284)", () => {
    it("creates an empty list in a state", () => {
        expect(createOptionList("loading")).toEqual({ status: "loading", items: [] });
        expect(createOptionList("ready")).toEqual({ status: "ready", items: [] });
    });

    it("turns a fulfilled lookup into a ready list, also an empty one", () => {
        expect(toOptionList({ status: "fulfilled", value: ["a", "b"] })).toEqual({
            status: "ready",
            items: ["a", "b"]
        });
        expect(toOptionList({ status: "fulfilled", value: [] })).toEqual({
            status: "ready",
            items: []
        });
    });

    it("turns a rejected lookup into a failed list with no items", () => {
        expect(toOptionList<string>({ status: "rejected", reason: new Error("down") })).toEqual({
            status: "failed",
            items: []
        });
    });
});
```

Create `packages/app-workflows/src/editor/model/getTeamSettingKeys.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getTeamSettingKeys } from "./getTeamSettingKeys.js";

describe("getTeamSettingKeys (R271, R284)", () => {
    it("lists the top-level settings that carry the team ui hint", () => {
        const schema = {
            type: "object",
            properties: {
                owner: { type: "string", ui: "team" },
                url: { type: "string" },
                backup: { type: "string", ui: "team" }
            }
        };

        expect(getTeamSettingKeys(schema)).toEqual(["owner", "backup"]);
    });

    it("is empty for no schema, no properties and other hints", () => {
        expect(getTeamSettingKeys(null)).toEqual([]);
        expect(getTeamSettingKeys({ type: "object" })).toEqual([]);
        expect(getTeamSettingKeys({ type: "object", properties: { who: { type: "string", ui: "user" } } })).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/collectTeamIds.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { collectTeamIds } from "./collectTeamIds.js";

const NOTIFY_TEAM = createAutomationDefinition({
    id: "notify-team",
    models: ["*"],
    settingsSchema: {
        type: "object",
        properties: { owner: { type: "string", ui: "team" }, note: { type: "string" } }
    }
});

describe("collectTeamIds", () => {
    it("lists the distinct team ids of the People steps in order", () => {
        const steps = [
            createReviewStep({ id: "a", config: { teams: ["team-2", "team-1"], assignment: null } }),
            createReviewStep({ id: "b", config: { teams: ["team-1", "team-3"], assignment: null } })
        ];

        expect(collectTeamIds(steps, [])).toEqual(["team-2", "team-1", "team-3"]);
    });

    it("ignores AI steps and automation steps without a team setting", () => {
        expect(collectTeamIds([createAutomationStep(), createAiStep()], [])).toEqual([]);
    });

    it("adds the team id a ui team setting of an automation step holds (R284)", () => {
        const steps = [
            createReviewStep({ config: { teams: ["team-1"], assignment: null } }),
            createAutomationStep({
                config: {
                    automationId: "notify-team",
                    settings: { owner: "team-2", note: "team-9" }
                }
            })
        ];

        expect(collectTeamIds(steps, [NOTIFY_TEAM])).toEqual(["team-1", "team-2"]);
    });

    it("skips an empty team setting and an automation the list does not offer", () => {
        const steps = [
            createAutomationStep({ config: { automationId: "notify-team", settings: { owner: "" } } }),
            createAutomationStep({ config: { automationId: "gone", settings: { owner: "team-2" } } })
        ];

        expect(collectTeamIds(steps, [NOTIFY_TEAM])).toEqual([]);
    });

    it("is empty for no steps and for a step without teams", () => {
        expect(collectTeamIds([], [])).toEqual([]);
        expect(collectTeamIds([createReviewStep({ config: {} })], [])).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/buildModelRowVms.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { buildModelRowVms } from "./buildModelRowVms.js";
import type { ModelRowsParams } from "./buildModelRowVms.js";

const ARTICLE = createWorkflowModelRow({
    model: "cms.article",
    modelId: "article",
    name: "Article",
    workflow: { id: "workflow-1", name: "Article review" }
});
const PRESS = createWorkflowModelRow({
    model: "cms.press",
    modelId: "press",
    name: "Press",
    workflow: { id: "workflow-2", name: "Press approval" }
});
const BLOG = createWorkflowModelRow({
    model: "cms.blog",
    modelId: "blog",
    name: "Blog",
    workflow: null
});

const params = (overrides: Partial<ModelRowsParams> = {}): ModelRowsParams => {
    return {
        rows: [ARTICLE, PRESS, BLOG],
        activeModelId: null,
        draftOpen: false,
        draftIsNew: false,
        draftDirty: false,
        draftStepCount: 0,
        ...overrides
    };
};

describe("buildModelRowVms (R280)", () => {
    it("shows the bound workflow's name for a bound row and No workflow for the others", () => {
        const rows = buildModelRowVms(params());

        expect(rows.map(row => row.subLine)).toEqual([
            "Article review",
            "Press approval",
            "No workflow"
        ]);
        expect(rows.map(row => row.bound)).toEqual([true, true, false]);
        expect(rows.map(row => row.modelId)).toEqual(["article", "press", "blog"]);
        expect(rows.map(row => row.name)).toEqual(["Article", "Press", "Blog"]);
    });

    it("shows the step count for the open model's loaded workflow, singular for one", () => {
        const many = buildModelRowVms(
            params({ activeModelId: "article", draftOpen: true, draftStepCount: 3 })
        );
        const one = buildModelRowVms(
            params({ activeModelId: "article", draftOpen: true, draftStepCount: 1 })
        );

        expect(many[0].subLine).toBe("3 steps");
        expect(one[0].subLine).toBe("1 step");
        expect(many[1].subLine).toBe("Press approval");
    });

    it("keeps the bound name for the open model while its draft is new and unsaved", () => {
        const rows = buildModelRowVms(
            params({
                activeModelId: "blog",
                draftOpen: true,
                draftIsNew: true,
                draftDirty: true,
                draftStepCount: 2
            })
        );

        expect(rows[2].subLine).toBe("No workflow");
        expect(rows[2].bound).toBe(false);
    });

    it("marks the open row active and shows the unsaved dot only on it, only while dirty", () => {
        const clean = buildModelRowVms(params({ activeModelId: "press", draftOpen: true }));
        const dirty = buildModelRowVms(
            params({ activeModelId: "press", draftOpen: true, draftDirty: true })
        );

        expect(clean.map(row => row.active)).toEqual([false, true, false]);
        expect(clean.map(row => row.unsaved)).toEqual([false, false, false]);
        expect(dirty.map(row => row.unsaved)).toEqual([false, true, false]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/dialogs.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { discardChangesDialog } from "./discardChangesDialog.js";

describe("discardChangesDialog (R279, QBZ-17)", () => {
    it("names the workflow", () => {
        expect(discardChangesDialog("Article review")).toEqual({
            kind: "discardChanges",
            title: "Discard unsaved changes?",
            body: "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost.",
            note: null,
            reviews: [],
            confirmLabel: "Discard changes",
            cancelLabel: "Keep editing",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says this workflow when the workflow has no name", () => {
        expect(discardChangesDialog("").body).toBe(
            "You have unsaved changes to “this workflow”. If you leave this workflow now, they are lost."
        );
        expect(discardChangesDialog("  ").body).toContain("“this workflow”");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

afterEach(() => {
    vi.useRealTimers();
});

describe("WorkflowEditorPresenter: init (R279, D162)", () => {
    it("shows no access without the editor permission and loads nothing", async () => {
        const { presenter, params, app, useCases, config } = createEditorPresenterSetup({
            editor: false
        });

        await presenter.init(params);

        expect(presenter.vm.status).toBe("noAccess");
        expect(app.init).not.toHaveBeenCalled();
        expect(useCases.listModels).not.toHaveBeenCalled();
        expect(config.listStepTypes).not.toHaveBeenCalled();
    });

    it("is loading until the first page arrives, then ready", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        const page = createDeferred<WorkflowModelPage>();
        useCases.listModels.mockReturnValue(page.promise);

        const pending = presenter.init(params);
        await vi.waitFor(() => expect(useCases.listModels).toHaveBeenCalled());

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.panel.loading).toBe(true);

        page.resolve(createWorkflowModelPage());
        await pending;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.panel.loading).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("initialises the app adapter before it lists the models (the icons need the cache)", async () => {
        const { presenter, params, app, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        const initOrder = app.init.mock.invocationCallOrder[0];
        const listOrder = useCases.listModels.mock.invocationCallOrder[0];
        expect(initOrder).toBeLessThan(listOrder);
    });

    it("lists the first page of 20 with no search and no cursor (R280)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        expect(useCases.listModels).toHaveBeenCalledTimes(1);
        expect(useCases.listModels).toHaveBeenCalledWith({ search: "", limit: 20, after: null });
    });

    it("takes the panel label and the search flag from the app adapter", async () => {
        const cms = createEditorPresenterSetup({ appKind: "cms" });
        const wb = createEditorPresenterSetup({ appKind: "wb" });

        await cms.presenter.init(cms.params);
        await wb.presenter.init(wb.params);

        expect(cms.presenter.vm.panel.label).toBe("Content models");
        expect(cms.presenter.vm.panel.showSearch).toBe(true);
        expect(wb.presenter.vm.panel.label).toBe("Website Builder");
        expect(wb.presenter.vm.panel.showSearch).toBe(false);
    });

    it("still opens the editor when the adapter init fails: only the icons are missing", async () => {
        const { presenter, params, app, useCases } = createEditorPresenterSetup();
        app.init.mockRejectedValueOnce(new Error("Models are not available."));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.error).toBeNull();
        expect(useCases.listModels).toHaveBeenCalledTimes(1);
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("fails when the first page fails, and retry loads it again", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockRejectedValueOnce(new Error("The server did not respond."));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond.");

        await presenter.retry();

        expect(presenter.vm.status).toBe("ready");
    });

    it("lists the rows render-ready (R280)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({ model: "cms.blog", modelId: "blog", name: "Blog", workflow: null }),
                    createWorkflowModelRow({ model: "cms.press", modelId: "press", name: "Press" })
                ]
            })
        );

        await presenter.init(params);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog", "press"]);
        expect(presenter.vm.panel.rows[0]).toMatchObject({
            name: "Blog",
            subLine: "No workflow",
            bound: false
        });
    });

    it("opens the first model on its own: a bound workflow loads into the draft", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        expect(useCases.getWorkflow).toHaveBeenCalledWith("workflow-1");
        expect(presenter.vm.header).toEqual({
            name: "Article review",
            nameError: null,
            appliesTo: "Applies to Article · Headless CMS model",
            dirty: false,
            saving: false,
            canSave: false,
            canDelete: true
        });
        expect(presenter.vm.empty).toBeNull();
        expect(presenter.vm.detail).toBe("workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({ active: true, subLine: "1 step" });
    });

    it("shows the empty state when the first model has no workflow", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );

        await presenter.init(params);

        expect(useCases.getWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty).toEqual({
            title: "Article has no workflow",
            description: "Add a workflow to require a review before Article content can be published."
        });
        expect(presenter.vm.detail).toBe("empty");
    });

    it("opens nothing when there is no model", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [] }));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty).toBeNull();
    });
});

describe("WorkflowEditorPresenter: options (R269, R275, R281, R284)", () => {
    it("loads every list and reports each as ready", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();

        await presenter.init(params);

        const options = presenter.getOptions();
        expect(options.stepTypes.status).toBe("ready");
        expect(options.stepTypes.items.map(item => item.type)).toEqual([
            "review",
            "ai",
            "automation"
        ]);
        expect(options.automations).toMatchObject({ status: "ready" });
        expect(options.automations.items.map(item => item.id)).toEqual(["send-webhook"]);
        expect(options.transports.items.map(item => item.id)).toEqual(["e-mail"]);
        expect(options.aiModels).toMatchObject({ status: "ready" });
        expect(options.aiModels.items.map(item => item.id)).toEqual(["openai/gpt-4o"]);
        expect(options.aiTools.items.map(item => item.name)).toEqual(["readContent"]);
        expect(config.listAiModels).toHaveBeenCalledTimes(1);
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("reports a list as loading while it is pending", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        const transports = createDeferred<NotificationTransport[]>();
        config.listNotificationTransports.mockReturnValue(transports.promise);

        const pending = presenter.init(params);
        await vi.waitFor(() => expect(config.listNotificationTransports).toHaveBeenCalled());

        expect(presenter.getOptions().transports.status).toBe("loading");
        expect(presenter.vm.optionsBanner).toBeNull();

        transports.resolve([createNotificationTransport()]);
        await pending;

        expect(presenter.getOptions().transports.status).toBe("ready");
    });

    it("never asks for AI models or tools when the AI row has no config schema, and calls them ready and empty", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listStepTypes.mockResolvedValue([
            createEditorStepType({ type: "review", title: "Review" }),
            createEditorStepType({ type: "ai", title: "AI", available: true, configSchema: null })
        ]);

        await presenter.init(params);

        expect(config.listAiModels).not.toHaveBeenCalled();
        expect(config.listAiTools).not.toHaveBeenCalled();
        const options = presenter.getOptions();
        expect(options.aiModels).toEqual({ status: "ready", items: [] });
        expect(options.aiTools).toEqual({ status: "ready", items: [] });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("never asks for AI models or tools when the AI step type is unavailable", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, available: false } : item;
        });
        config.listStepTypes.mockResolvedValue(stepTypes);

        await presenter.init(params);

        expect(config.listAiModels).not.toHaveBeenCalled();
        expect(presenter.getOptions().aiModels.status).toBe("ready");
    });

    it("does not request the AI lists when the step types fail, and shows the banner", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listStepTypes.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(config.listAiModels).not.toHaveBeenCalled();
        expect(presenter.getOptions().stepTypes).toEqual({ status: "failed", items: [] });
        expect(presenter.getOptions().aiModels.status).toBe("ready");
        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });
    });

    it("fails one list alone, keeps the others and shows the banner", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listNotificationTransports.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });
        const options = presenter.getOptions();
        expect(options.transports).toEqual({ status: "failed", items: [] });
        expect(options.automations.status).toBe("ready");
        expect(options.stepTypes.status).toBe("ready");
        expect(options.stepTypes.items).toHaveLength(3);
    });

    it("calls an empty list that loaded ready, not failed, and shows no banner", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listNotificationTransports.mockResolvedValue([]);

        await presenter.init(params);

        expect(presenter.getOptions().transports).toEqual({ status: "ready", items: [] });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("makes the failed list ready and clears the banner when Try again reloads", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listNotificationTransports.mockRejectedValueOnce(new Error("down"));
        await presenter.init(params);

        await presenter.retryOptions();

        expect(presenter.vm.optionsBanner).toBeNull();
        expect(presenter.getOptions().transports.status).toBe("ready");
        expect(presenter.getOptions().transports.items).toHaveLength(1);
    });

    it("fails a failed AI list with no items and shows the banner", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listAiModels.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        const options = presenter.getOptions();
        expect(options.aiModels).toEqual({ status: "failed", items: [] });
        expect(options.aiTools.status).toBe("ready");
        expect(presenter.vm.optionsBanner).not.toBeNull();
    });
});

describe("WorkflowEditorPresenter: dispose", () => {
    it("resets the state and drops a pending response", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        const page = createDeferred<WorkflowModelPage>();
        useCases.listModels.mockReturnValue(page.promise);
        const pending = presenter.init(params);
        await vi.waitFor(() => expect(useCases.listModels).toHaveBeenCalled());

        presenter.dispose();
        page.resolve(createWorkflowModelPage());
        await pending;

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.panel.rows).toEqual([]);
        expect(useCases.getWorkflow).not.toHaveBeenCalled();
    });

    it("drops a pending search timer", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.listModels.mockClear();
        vi.useFakeTimers();

        presenter.setSearch("art");
        presenter.dispose();
        await vi.advanceTimersByTimeAsync(1000);

        expect(useCases.listModels).not.toHaveBeenCalled();
        expect(presenter.vm.panel.search).toBe("");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

const ARTICLE = createWorkflowModelRow({
    model: "cms.article",
    modelId: "article",
    name: "Article",
    workflow: { id: "workflow-1", name: "Article review" }
});
const PRESS = createWorkflowModelRow({
    model: "cms.press",
    modelId: "press",
    name: "Press",
    workflow: { id: "workflow-2", name: "Press approval" }
});
const BLOG = createWorkflowModelRow({
    model: "cms.blog",
    modelId: "blog",
    name: "Blog",
    workflow: null
});

const setupWithThreeModels = () => {
    const setup = createEditorPresenterSetup();
    setup.useCases.listModels.mockResolvedValue(
        createWorkflowModelPage({ rows: [ARTICLE, PRESS, BLOG] })
    );
    setup.useCases.getWorkflow.mockImplementation(async (id: string): Promise<EditorWorkflow> => {
        if (id === "workflow-2") {
            return createEditorWorkflow({
                id: "workflow-2",
                name: "Press approval",
                models: ["cms.press"]
            });
        }
        return createEditorWorkflow();
    });
    return setup;
};

describe("WorkflowEditorPresenter: search (R280, QBZ-20)", () => {
    it("updates the input at once and searches 250 ms after the last keystroke from the first page", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.listModels.mockClear();
        vi.useFakeTimers();

        presenter.setSearch("art");
        presenter.setSearch("arti");

        expect(presenter.vm.panel.search).toBe("arti");
        await vi.advanceTimersByTimeAsync(249);
        expect(useCases.listModels).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(useCases.listModels).toHaveBeenCalledTimes(1);
        expect(useCases.listModels).toHaveBeenCalledWith({ search: "arti", limit: 20, after: null });
    });

    it("replaces the rows with the result of the new search", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("blog");
        await vi.advanceTimersByTimeAsync(250);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });

    it("says No models match when the search finds nothing", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [] }));
        vi.useFakeTimers();

        presenter.setSearch("zzz");
        await vi.advanceTimersByTimeAsync(250);

        expect(presenter.vm.panel.rows).toEqual([]);
        expect(presenter.vm.panel.emptyText).toBe("No models match “zzz”.");
    });

    it("has no empty text without a search", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        expect(presenter.vm.panel.emptyText).toBeNull();
    });

    it("drops the answer of an older search", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        const first = createDeferred<ReturnType<typeof createWorkflowModelPage>>();
        useCases.listModels.mockReturnValueOnce(first.promise);
        useCases.listModels.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("a");
        await vi.advanceTimersByTimeAsync(250);
        presenter.setSearch("ab");
        await vi.advanceTimersByTimeAsync(250);
        first.resolve(createWorkflowModelPage({ rows: [PRESS] }));
        await vi.advanceTimersByTimeAsync(0);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });
});

describe("WorkflowEditorPresenter: load more (R280)", () => {
    it("appends the next page with the cursor while there is more", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        useCases.listModels.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        useCases.listModels.mockResolvedValueOnce(createWorkflowModelPage({ rows: [PRESS] }));
        await presenter.init(params);
        expect(presenter.vm.panel.hasMore).toBe(true);

        await presenter.loadMore();

        expect(useCases.listModels).toHaveBeenLastCalledWith({ search: "", limit: 20, after: "c1" });
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article", "press"]);
        expect(presenter.vm.panel.hasMore).toBe(false);
        expect(presenter.vm.panel.loadingMore).toBe(false);
    });

    it("restarts at the first page after a load more and replaces the rows", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        useCases.listModels.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        useCases.listModels.mockResolvedValueOnce(createWorkflowModelPage({ rows: [PRESS] }));
        await presenter.loadMore();
        useCases.listModels.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("x");
        await vi.advanceTimersByTimeAsync(250);

        expect(useCases.listModels).toHaveBeenLastCalledWith({ search: "x", limit: 20, after: null });
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });

    it("drops a load more answer that arrives after a new search", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        useCases.listModels.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        const nextPage = createDeferred<ReturnType<typeof createWorkflowModelPage>>();
        useCases.listModels.mockReturnValueOnce(nextPage.promise);
        const loading = presenter.loadMore();
        useCases.listModels.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("x");
        await vi.advanceTimersByTimeAsync(250);
        nextPage.resolve(createWorkflowModelPage({ rows: [PRESS] }));
        await loading;

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
        expect(presenter.vm.panel.loadingMore).toBe(false);
    });

    it("does nothing without more pages", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.listModels.mockClear();

        await presenter.loadMore();

        expect(useCases.listModels).not.toHaveBeenCalled();
    });

    it("shows a panel error when a page fails and reloads the first page on retry", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        useCases.listModels.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        useCases.listModels.mockRejectedValueOnce(new Error("down"));

        await presenter.loadMore();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.panel.error).toBe("Could not load workflows");
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article"]);

        useCases.listModels.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE, PRESS] })
        );
        await presenter.retryModels();

        expect(presenter.vm.panel.error).toBeNull();
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article", "press"]);
    });
});

describe("WorkflowEditorPresenter: open a model (R279)", () => {
    it("loads the bound workflow of another model when the draft is clean", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.selectModel("press");

        expect(useCases.getWorkflow).toHaveBeenLastCalledWith("workflow-2");
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.header?.appliesTo).toBe("Applies to Press · Headless CMS model");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([false, true, false]);
        expect(presenter.vm.dialog).toBeNull();
    });

    it("shows the empty state for a model without a workflow", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.selectModel("blog");

        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Blog has no workflow");
        expect(presenter.vm.flow.steps).toEqual([]);
    });

    it("does nothing for the model that is already open", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.getWorkflow.mockClear();

        await presenter.selectModel("article");

        expect(useCases.getWorkflow).not.toHaveBeenCalled();
    });

    it("asks before leaving a dirty draft and keeps editing on cancel (QBZ-17)", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");
        useCases.getWorkflow.mockClear();

        await presenter.selectModel("press");

        expect(presenter.vm.dialog).toEqual({
            kind: "discardChanges",
            title: "Discard unsaved changes?",
            body: "You have unsaved changes to “Changed”. If you leave this workflow now, they are lost.",
            note: null,
            reviews: [],
            confirmLabel: "Discard changes",
            cancelLabel: "Keep editing",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
        expect(useCases.getWorkflow).not.toHaveBeenCalled();

        presenter.cancelDialog();

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Changed");
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("discards the draft and opens the model on confirm", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");
        await presenter.selectModel("press");

        await presenter.confirmDialog();

        expect(useCases.getWorkflow).toHaveBeenLastCalledWith("workflow-2");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("asks before leaving a new unsaved draft", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);
        await presenter.selectModel("blog");
        presenter.createWorkflow();

        await presenter.selectModel("press");

        expect(presenter.vm.dialog?.kind).toBe("discardChanges");
    });

    it("unbinds the row and shows the empty state when the bound workflow was deleted", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.getWorkflow.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "Workflow not found.",
                code: WorkflowErrorCode.NotFound,
                data: { id: "workflow-2" }
            })
        );

        await presenter.selectModel("press");

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.empty?.title).toBe("Press has no workflow");
        expect(presenter.vm.panel.rows[1]).toMatchObject({ bound: false, subLine: "No workflow" });
    });

    it("fails the page when the workflow does not load, and retry opens that model again", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        useCases.getWorkflow.mockRejectedValueOnce(new Error("The server did not respond."));

        await presenter.selectModel("press");

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond.");

        await presenter.retry();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([false, true, false]);
    });

    it("ignores the answer of a model that is no longer the open one", async () => {
        const { presenter, params, useCases } = setupWithThreeModels();
        await presenter.init(params);
        const slow = createDeferred<EditorWorkflow>();
        useCases.getWorkflow.mockReturnValueOnce(slow.promise);

        const pendingPress = presenter.selectModel("press");
        await presenter.selectModel("article");
        slow.resolve(
            createEditorWorkflow({ id: "workflow-2", name: "Press approval", models: ["cms.press"] })
        );
        await pendingPress;

        expect(presenter.vm.header?.name).toBe("Article review");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([true, false, false]);
    });

    it("shows the open workflow's step count in its row", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
        expect(presenter.vm.panel.rows[1].subLine).toBe("Press approval");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

describe("WorkflowEditorPresenter: team names of the open workflow (R268, Review Focus 9)", () => {
    it("resolves the distinct team ids of every People step with one listTeams call", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createReviewStep({
                        id: "a",
                        config: { teams: ["team-1", "team-2"], assignment: null }
                    }),
                    createReviewStep({ id: "b", config: { teams: ["team-2"], assignment: null } })
                ]
            })
        );

        await presenter.init(params);

        expect(config.listTeams).toHaveBeenCalledTimes(1);
        expect(config.listTeams).toHaveBeenCalledWith({
            search: null,
            ids: ["team-1", "team-2"],
            limit: null
        });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("also resolves the team a ui team setting of an automation step holds (R284)", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        config.listAutomationDefinitions.mockResolvedValue([
            createAutomationDefinition({
                id: "notify-team",
                models: ["*"],
                settingsSchema: {
                    type: "object",
                    properties: { owner: { type: "string", ui: "team" } }
                }
            })
        ]);
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createAutomationStep({
                        config: { automationId: "notify-team", settings: { owner: "team-7" } }
                    })
                ]
            })
        );

        await presenter.init(params);

        expect(config.listTeams).toHaveBeenCalledWith({
            search: null,
            ids: ["team-7"],
            limit: null
        });
    });

    it("does not call listTeams for a workflow without People steps", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [] }));

        await presenter.init(params);

        expect(config.listTeams).not.toHaveBeenCalled();
    });

    it("does not look known teams up again on Try again", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        expect(config.listTeams).toHaveBeenCalledTimes(1);
        config.listTeams.mockClear();

        await presenter.retryOptions();

        expect(config.listTeams).not.toHaveBeenCalled();
    });

    it("asks for at most 200 ids, the server's cap", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        const teams = Array.from({ length: 250 }, (_, index) => `team-${index}`);
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [createReviewStep({ config: { teams, assignment: null } })]
            })
        );

        await presenter.init(params);

        const request = config.listTeams.mock.calls[0][0];
        expect(request.ids).toHaveLength(200);
        expect(request.ids?.[0]).toBe("team-0");
    });

    it("shows the options banner when the lookup fails, and Try again looks the teams up again", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });

        config.listTeams.mockResolvedValueOnce({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors" })],
            missingIds: []
        });
        await presenter.retryOptions();

        expect(config.listTeams).toHaveBeenCalledTimes(2);
        expect(presenter.vm.optionsBanner).toBeNull();
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Task 5c already added the `MainGraphQLClient` import and its `registerInstance` line to `mount`; do nothing for it. Add this import after the `ReviewNotificationService` import line:

```ts
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
```

Then append a new `describe` at the end of the file:

```ts
describe("WorkflowsAdminApp workflow editor presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the editor presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowEditorPresenter);
        const second = container.resolve(WorkflowEditorPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no editor presenter when the flag is off (R211, Review Focus 10)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowEditorPresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/optionLists.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getTeamSettingKeys.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/collectTeamIds.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildModelRowVms.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: the first four fail with `Failed to resolve import "./optionLists.js"` (and the like for `./collectTeamIds.js`, `./buildModelRowVms.js`, `./discardChangesDialog.js`); the three presenter files fail with `Failed to resolve import "~/editor/presentation/editor/abstractions.js"` from `editorPresenterSetup.ts`; `app.test.tsx` fails the two new cases with the same unresolved import. Record the RED.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts`:

```ts
import type { ReactNode } from "react";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";

/*
 * What the shared editor needs from one app besides the editor use cases (R202): the panel label,
 * the wording of the header, the one-time setup, the model icon and the content adapter that links
 * a blocking review to its content. The app package implements it (Tasks 20, 21) and passes it to
 * the view as a prop. `app-workflows` has no icon library, so the app renders the icon.
 */
export interface WorkflowEditorAppAdapter {
    appKind: WorkflowEditorAppKind;
    // `Content models` for the CMS, `Website Builder` for the WB (the panel's style shows it uppercase, R280).
    panelLabel: string;
    // The header's `Applies to {Model} · {appliesToLabel}`.
    appliesToLabel: string;
    // Runs once before the model list is shown (the CMS fills the admin `ModelsCache`); the WB does nothing.
    init(): Promise<void>;
    // The icon of a model row by its `modelId`; null for none.
    renderModelIcon(modelId: string): ReactNode;
    contentAdapter: IReviewContentAdapter;
}
```

Create `packages/app-workflows/src/editor/presentation/editor/constants.ts`:

```ts
// 20 per page, sorted by name on the server (R280, QBZ-20).
export const MODEL_PAGE_SIZE = 20;

// The debounce of the model search and of a typed team search (R280, R268).
export const SEARCH_DEBOUNCE_MS = 250;

// How many teams one picker search asks for (the server's default).
export const TEAM_SEARCH_LIMIT = 50;

// The most ids one `listTeams` call may carry (R268).
export const TEAM_IDS_LIMIT = 200;

export const OPTIONS_FAILURE_MESSAGE = "Could not load the step options.";

export const MODELS_FAILURE_MESSAGE = "Could not load workflows";
```

Create `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";

// The per-app parts the shared view passes in (the 8a mounting pattern).
export interface WorkflowEditorInitParams {
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

export type WorkflowEditorStatus = "loading" | "ready" | "failed" | "noAccess";

// What the right side shows: nothing, a loading workflow, a model without a workflow, or a draft.
export type WorkflowEditorDetailKind = "none" | "loading" | "empty" | "workflow";

export interface ModelRowVm {
    modelId: string;
    name: string;
    // `{n} steps`, the bound workflow's name or `No workflow` (R280).
    subLine: string;
    bound: boolean;
    unsaved: boolean;
    active: boolean;
}

export interface ModelPanelVm {
    label: string;
    showSearch: boolean;
    search: string;
    rows: ModelRowVm[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    // `No models match “{q}”.` or null.
    emptyText: string | null;
    // `Could not load workflows` when a search or a page failed, else null.
    error: string | null;
}

export interface WorkflowHeaderVm {
    name: string;
    nameError: string | null;
    // `Applies to {Model} · {appliesToLabel}`.
    appliesTo: string;
    dirty: boolean;
    saving: boolean;
    canSave: boolean;
    // A workflow that exists on the server can be deleted; a new draft cannot.
    canDelete: boolean;
}

export interface EmptyWorkflowVm {
    title: string;
    description: string;
}

export interface OptionsBannerVm {
    message: string;
}

export interface DialogReviewVm {
    reviewId: string;
    title: string;
    // `Step {n} of {N} · {step}`.
    position: string;
    url: string;
}

export type WorkflowEditorDialogKind = "discardChanges";

/*
 * The one dialog the editor's presenters share (Task 18 renders it). `confirmLabel` is null when
 * only the secondary button exists (the blocked delete dialog's Close). `note` is a closing
 * sentence below the list. `destructive` styles the confirm button, `cancelDestructive` the
 * secondary one.
 */
export interface WorkflowEditorDialogVm {
    kind: WorkflowEditorDialogKind;
    title: string;
    body: string;
    note: string | null;
    reviews: DialogReviewVm[];
    confirmLabel: string | null;
    cancelLabel: string;
    destructive: boolean;
    cancelDestructive: boolean;
    busy: boolean;
}

export interface IWorkflowEditorViewModel {
    status: WorkflowEditorStatus;
    // The message of a failed load (`status` `failed`), else null.
    error: string | null;
    panel: ModelPanelVm;
    detail: WorkflowEditorDetailKind;
    // The open workflow or draft, null when none.
    header: WorkflowHeaderVm | null;
    // The open model has no workflow, else null.
    empty: EmptyWorkflowVm | null;
    optionsBanner: OptionsBannerVm | null;
    dialog: WorkflowEditorDialogVm | null;
}

export type OptionListStatus = "loading" | "ready" | "failed";

// One lookup list and where it stands, so an empty list is never shown as a failure (R284).
export interface OptionList<T> {
    status: OptionListStatus;
    items: T[];
}

/*
 * Domain data the step drawer's forms are built from (not part of the VM, R234). A list that was
 * not requested (the AI lists without the AI editor) is `ready` with no items.
 */
export interface WorkflowEditorOptions {
    stepTypes: OptionList<EditorStepType>;
    automations: OptionList<AutomationDefinition>;
    transports: OptionList<NotificationTransport>;
    aiModels: OptionList<AiModel>;
    aiTools: OptionList<AiTool>;
}

export interface IWorkflowEditorPresenter {
    readonly vm: IWorkflowEditorViewModel;
    init(params: WorkflowEditorInitParams): Promise<void>;
    // Runs `init` again after a failed load (and reopens the model whose workflow did not load).
    retry(): Promise<void>;
    // Reloads every option list and the team names of the open workflow.
    retryOptions(): Promise<void>;
    retryModels(): Promise<void>;
    setSearch(search: string): void;
    loadMore(): Promise<void>;
    selectModel(modelId: string): Promise<void>;
    // The primary button of the open dialog.
    confirmDialog(): Promise<void>;
    // The secondary button of the open dialog.
    cancelDialog(): void;
    getOptions(): WorkflowEditorOptions;
    dispose(): void;
}

export const WorkflowEditorPresenter = createAbstraction<IWorkflowEditorPresenter>(
    "Workflows/WorkflowEditorPresenter"
);

export namespace WorkflowEditorPresenter {
    export type Interface = IWorkflowEditorPresenter;
    export type ViewModel = IWorkflowEditorViewModel;
}
```

Create `packages/app-workflows/src/editor/presentation/editor/optionLists.ts`:

```ts
import type { OptionList } from "./abstractions.js";
import type { OptionListStatus } from "./abstractions.js";

// An empty list in the given state.
export const createOptionList = <T>(status: OptionListStatus): OptionList<T> => {
    return { status, items: [] };
};

// What a lookup settled to: `ready` with its items, or `failed` with none.
export const toOptionList = <T>(result: PromiseSettledResult<T[]>): OptionList<T> => {
    if (result.status === "fulfilled") {
        return { status: "ready", items: result.value };
    }
    return { status: "failed", items: [] };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/PendingDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "./abstractions.js";

// Leaving a dirty draft for another model (R279).
export interface SwitchModelAction {
    kind: "switchModel";
    modelId: string;
}

// Task 9b and Task 10 add the actions of the step, save and delete dialogs here.
export type PendingAction = SwitchModelAction;

/*
 * The open dialog: its render-ready texts, built when it opened, and what its primary button does.
 * Private state of the presenter, never part of the VM.
 */
export interface PendingDialog {
    vm: WorkflowEditorDialogVm;
    action: PendingAction;
}
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/discardChangesDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

// R279, QBZ-17: shown when the admin leaves a dirty workflow through the model list.
export const discardChangesDialog = (workflowName: string): WorkflowEditorDialogVm => {
    const name = workflowName.trim() === "" ? "this workflow" : workflowName;

    return {
        kind: "discardChanges",
        title: "Discard unsaved changes?",
        body: `You have unsaved changes to “${name}”. If you leave this workflow now, they are lost.`,
        note: null,
        reviews: [],
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/model/getTeamSettingKeys.ts` (the step drawer's `hasTeamSetting`, Task 12, builds on it):

```ts
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { isRecord } from "./isRecord.js";

// The top-level settings of an automation's schema that carry the `team` ui hint (R271, R284).
export const getTeamSettingKeys = (schema: JsonSchema | null): string[] => {
    const record: unknown = schema;
    if (!isRecord(record) || !isRecord(record.properties)) {
        return [];
    }
    return Object.entries(record.properties)
        .filter(([, property]) => isRecord(property) && property.ui === "team")
        .map(([key]) => key);
};
```

Create `packages/app-workflows/src/editor/presentation/editor/collectTeamIds.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getTeamSettingKeys } from "~/editor/model/getTeamSettingKeys.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";

const getStepTeamIds = (step: EditorStep, automations: AutomationDefinition[]): string[] => {
    if (step.type === StepTypeId.Review) {
        return readReviewConfig(step.config).teams;
    }
    if (step.type !== StepTypeId.Automation) {
        return [];
    }
    // A `ui: "team"` setting holds one team id (R271, R284); its keys come from the definition.
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition) {
        return [];
    }
    const ids: string[] = [];
    for (const key of getTeamSettingKeys(definition.settingsSchema)) {
        const value = config.settings[key];
        if (typeof value === "string" && value !== "") {
            ids.push(value);
        }
    }
    return ids;
};

// The distinct team ids of the People steps and of the `ui: "team"` settings of the automation
// steps, in step order, for one `listTeams({ ids })` call.
export const collectTeamIds = (
    steps: EditorStep[],
    automations: AutomationDefinition[]
): string[] => {
    const ids: string[] = [];
    for (const step of steps) {
        for (const id of getStepTeamIds(step, automations)) {
            if (!ids.includes(id)) {
                ids.push(id);
            }
        }
    }
    return ids;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/buildModelRowVms.ts`:

```ts
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { ModelRowVm } from "./abstractions.js";

export interface ModelRowsParams {
    rows: WorkflowModelRow[];
    activeModelId: string | null;
    draftOpen: boolean;
    draftIsNew: boolean;
    draftDirty: boolean;
    draftStepCount: number;
}

function getSubLine(row: WorkflowModelRow, active: boolean, params: ModelRowsParams): string {
    // The open model shows its loaded workflow's step count; an unsaved new draft is not one.
    if (active && params.draftOpen && !params.draftIsNew) {
        const count = params.draftStepCount;
        return `${count} ${count === 1 ? "step" : "steps"}`;
    }
    return row.workflow === null ? "No workflow" : row.workflow.name;
}

/*
 * The rows of the model panel (R280). Rows carry no step count from the server (QBZ-20), so another
 * bound row shows its workflow's name (a deviation from the design's `{n} steps`).
 */
export const buildModelRowVms = (params: ModelRowsParams): ModelRowVm[] => {
    return params.rows.map(row => {
        const active = row.modelId === params.activeModelId;
        return {
            modelId: row.modelId,
            name: row.name,
            subLine: getSubLine(row, active, params),
            bound: row.workflow !== null,
            unsaved: active && params.draftDirty,
            active
        };
    });
};
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { isAiEditable } from "~/editor/model/isAiEditable.js";
import { WorkflowDraft } from "~/editor/model/WorkflowDraft.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
import { WorkflowEditorPresenter as Abstraction } from "./abstractions.js";
import type { EmptyWorkflowVm } from "./abstractions.js";
import type { ModelPanelVm } from "./abstractions.js";
import type { OptionList } from "./abstractions.js";
import type { OptionsBannerVm } from "./abstractions.js";
import type { WorkflowEditorDetailKind } from "./abstractions.js";
import type { WorkflowEditorDialogVm } from "./abstractions.js";
import type { WorkflowEditorInitParams } from "./abstractions.js";
import type { WorkflowEditorOptions } from "./abstractions.js";
import type { WorkflowEditorStatus } from "./abstractions.js";
import type { WorkflowHeaderVm } from "./abstractions.js";
import { buildModelRowVms } from "./buildModelRowVms.js";
import { collectTeamIds } from "./collectTeamIds.js";
import { MODEL_PAGE_SIZE } from "./constants.js";
import { MODELS_FAILURE_MESSAGE } from "./constants.js";
import { OPTIONS_FAILURE_MESSAGE } from "./constants.js";
import { SEARCH_DEBOUNCE_MS } from "./constants.js";
import { TEAM_IDS_LIMIT } from "./constants.js";
import { discardChangesDialog } from "./dialogs/discardChangesDialog.js";
import { createOptionList } from "./optionLists.js";
import { toOptionList } from "./optionLists.js";
import type { PendingDialog } from "./PendingDialog.js";

function toMessage(error: unknown): string | null {
    return error instanceof Error ? error.message : null;
}

function mergeTeams(
    known: WorkflowTeamSummary[],
    incoming: WorkflowTeamSummary[]
): WorkflowTeamSummary[] {
    const merged = [...known];
    for (const team of incoming) {
        const index = merged.findIndex(item => item.id === team.id);
        if (index === -1) {
            merged.push(team);
        } else {
            merged[index] = team;
        }
    }
    return merged;
}

class WorkflowEditorPresenterImpl implements Abstraction.Interface {
    private params: WorkflowEditorInitParams | null = null;
    private status: WorkflowEditorStatus = "loading";
    private loadError: string | null = null;
    // The model whose workflow did not load, reopened by `retry`.
    private failedModelId: string | null = null;
    private rows: WorkflowModelRow[] = [];
    private cursor: string | null = null;
    private hasMore = false;
    private modelsLoading = false;
    private loadingMore = false;
    private modelsFailed = false;
    private searchDraft = "";
    private search = "";
    private selectedRow: WorkflowModelRow | null = null;
    private detail: WorkflowEditorDetailKind = "none";
    private stepTypes: OptionList<EditorStepType> = createOptionList("loading");
    private automations: OptionList<AutomationDefinition> = createOptionList("loading");
    private transports: OptionList<NotificationTransport> = createOptionList("loading");
    private aiModels: OptionList<AiModel> = createOptionList("loading");
    private aiTools: OptionList<AiTool> = createOptionList("loading");
    // Every team seen by id; the names of the open workflow's People steps are resolved into it.
    private teamsKnown: WorkflowTeamSummary[] = [];
    // The name lookup of the open workflow failed.
    private teamsFailed = false;
    private draft = new WorkflowDraft();
    private nameError: string | null = null;
    private saving = false;
    private pending: PendingDialog | null = null;
    private dialogBusy = false;
    // Generations: every init, dispose, search and open starts a new one and an older response is ignored.
    private runToken = 0;
    private modelToken = 0;
    private selectToken = 0;
    private optionsToken = 0;
    private resolveToken = 0;
    private modelSearchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private config: WorkflowConfigUseCases.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            WorkflowEditorPresenterImpl,
            | "config"
            | "identityContext"
            | "params"
            | "failedModelId"
            | "rows"
            | "selectedRow"
            | "stepTypes"
            | "automations"
            | "transports"
            | "aiModels"
            | "aiTools"
            | "teamsKnown"
            | "draft"
            | "pending"
            | "runToken"
            | "modelToken"
            | "selectToken"
            | "optionsToken"
            | "resolveToken"
            | "modelSearchTimer"
        >(this, {
            config: false,
            identityContext: false,
            params: observableRef,
            failedModelId: false,
            rows: observableRef,
            selectedRow: observableRef,
            stepTypes: observableRef,
            automations: observableRef,
            transports: observableRef,
            aiModels: observableRef,
            aiTools: observableRef,
            teamsKnown: observableRef,
            draft: false,
            pending: observableRef,
            runToken: false,
            modelToken: false,
            selectToken: false,
            optionsToken: false,
            resolveToken: false,
            modelSearchTimer: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            status: this.status,
            error: this.status === "failed" ? this.loadError : null,
            panel: this.buildPanel(),
            detail: this.detail,
            header: this.buildHeader(),
            empty: this.buildEmpty(),
            optionsBanner: this.buildOptionsBanner(),
            dialog: this.buildDialog()
        };
    }

    async init(params: WorkflowEditorInitParams): Promise<void> {
        this.dispose();
        this.params = params;
        const token = this.runToken;

        const identity = this.identityContext.getIdentity();
        const permissions = getWorkflowsPermissionSet(identity);
        if (!permissions.editor) {
            this.status = "noAccess";
            return;
        }

        try {
            await params.app.init();
        } catch {
            // A failed adapter init only leaves the model icons empty: a workflows editor may lack
            // the CMS model permissions, and the editor must still open.
        }
        if (token !== this.runToken) {
            return;
        }

        await Promise.all([this.loadModels(false), this.loadOptions()]);
        if (token !== this.runToken || this.status !== "ready") {
            return;
        }
        const first = this.rows[0];
        if (first) {
            await this.openModel(first.modelId);
        }
    }

    async retry(): Promise<void> {
        const params = this.params;
        if (params === null || this.status !== "failed") {
            return;
        }
        const modelId = this.failedModelId;
        await this.init(params);
        // A model that is not on the first page cannot be reopened; the first model stays open.
        if (modelId !== null && this.status === "ready") {
            await this.selectModel(modelId);
        }
    }

    async retryOptions(): Promise<void> {
        await this.loadOptions();
        await this.resolveTeams();
    }

    async retryModels(): Promise<void> {
        await this.loadModels(false);
    }

    setSearch(search: string): void {
        this.cancelModelSearchTimer();
        this.searchDraft = search;
        if (search === this.search) {
            return;
        }
        this.modelSearchTimer = setTimeout(() => {
            this.modelSearchTimer = null;
            void this.applySearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    async loadMore(): Promise<void> {
        if (!this.hasMore || this.loadingMore || this.modelsLoading || this.cursor === null) {
            return;
        }
        await this.loadModels(true);
    }

    async selectModel(modelId: string): Promise<void> {
        const selected = this.selectedRow;
        if (selected !== null && selected.modelId === modelId) {
            return;
        }
        if (this.draft.isDirty) {
            const row = this.rows.find(item => item.modelId === modelId);
            if (row) {
                this.pending = {
                    vm: discardChangesDialog(this.draft.name),
                    action: { kind: "switchModel", modelId }
                };
            }
            return;
        }
        await this.openModel(modelId);
    }

    async confirmDialog(): Promise<void> {
        const pending = this.pending;
        if (pending === null || this.dialogBusy) {
            return;
        }
        await this.openModel(pending.action.modelId);
    }

    cancelDialog(): void {
        if (this.dialogBusy) {
            return;
        }
        this.pending = null;
    }

    getOptions(): WorkflowEditorOptions {
        return {
            stepTypes: this.stepTypes,
            automations: this.automations,
            transports: this.transports,
            aiModels: this.aiModels,
            aiTools: this.aiTools
        };
    }

    dispose(): void {
        this.runToken += 1;
        this.modelToken += 1;
        this.selectToken += 1;
        this.optionsToken += 1;
        this.resolveToken += 1;
        this.cancelModelSearchTimer();
        this.params = null;
        this.status = "loading";
        this.loadError = null;
        this.failedModelId = null;
        this.rows = [];
        this.cursor = null;
        this.hasMore = false;
        this.modelsLoading = false;
        this.loadingMore = false;
        this.modelsFailed = false;
        this.searchDraft = "";
        this.search = "";
        this.selectedRow = null;
        this.detail = "none";
        this.stepTypes = createOptionList("loading");
        this.automations = createOptionList("loading");
        this.transports = createOptionList("loading");
        this.aiModels = createOptionList("loading");
        this.aiTools = createOptionList("loading");
        this.teamsKnown = [];
        this.teamsFailed = false;
        this.draft.reset(null);
        this.nameError = null;
        this.saving = false;
        this.pending = null;
        this.dialogBusy = false;
    }

    private buildPanel(): ModelPanelVm {
        const params = this.params;
        const selected = this.selectedRow;
        const needle = this.search.trim();
        const noMatch =
            !this.modelsLoading && !this.modelsFailed && this.rows.length === 0 && needle !== "";

        return {
            label: params ? params.app.panelLabel : "",
            showSearch: params ? params.app.appKind === "cms" : false,
            search: this.searchDraft,
            rows: buildModelRowVms({
                rows: this.rows,
                activeModelId: selected ? selected.modelId : null,
                draftOpen: this.draft.isOpen,
                draftIsNew: this.draft.isNew,
                draftDirty: this.draft.isDirty,
                draftStepCount: this.draft.steps.length
            }),
            loading: this.modelsLoading,
            loadingMore: this.loadingMore,
            hasMore: this.hasMore,
            emptyText: noMatch ? `No models match “${needle}”.` : null,
            error: this.modelsFailed ? MODELS_FAILURE_MESSAGE : null
        };
    }

    private buildHeader(): WorkflowHeaderVm | null {
        const params = this.params;
        const row = this.selectedRow;
        if (this.detail !== "workflow" || params === null || row === null) {
            return null;
        }
        const dirty = this.draft.isDirty;

        return {
            name: this.draft.name,
            nameError: this.nameError,
            appliesTo: `Applies to ${row.name} · ${params.app.appliesToLabel}`,
            dirty,
            saving: this.saving,
            canSave: dirty && !this.saving,
            canDelete: !this.draft.isNew
        };
    }

    private buildEmpty(): EmptyWorkflowVm | null {
        const row = this.selectedRow;
        if (this.detail !== "empty" || row === null) {
            return null;
        }
        return {
            title: `${row.name} has no workflow`,
            description: `Add a workflow to require a review before ${row.name} content can be published.`
        };
    }

    private buildOptionsBanner(): OptionsBannerVm | null {
        if (this.status !== "ready") {
            return null;
        }
        const statuses = [
            this.stepTypes.status,
            this.automations.status,
            this.transports.status,
            this.aiModels.status,
            this.aiTools.status
        ];
        if (statuses.includes("failed") || this.teamsFailed) {
            return { message: OPTIONS_FAILURE_MESSAGE };
        }
        return null;
    }

    private buildDialog(): WorkflowEditorDialogVm | null {
        if (this.pending === null) {
            return null;
        }
        return { ...this.pending.vm, busy: this.dialogBusy };
    }

    private cancelModelSearchTimer(): void {
        if (this.modelSearchTimer !== null) {
            clearTimeout(this.modelSearchTimer);
            this.modelSearchTimer = null;
        }
    }

    private async applySearch(search: string): Promise<void> {
        this.search = search;
        await this.loadModels(false);
    }

    private async loadModels(more: boolean): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        const token = this.beginModelsLoad(more);
        const after = more ? this.cursor : null;
        try {
            const page = await params.useCases.listModels({
                search: this.search,
                limit: MODEL_PAGE_SIZE,
                after
            });
            if (token === this.modelToken) {
                this.applyModelsPage(page, more);
            }
        } catch (error) {
            if (token === this.modelToken) {
                this.applyModelsFailure(error);
            }
        }
    }

    private beginModelsLoad(more: boolean): number {
        this.modelToken += 1;
        if (more) {
            this.loadingMore = true;
        } else {
            this.modelsLoading = true;
        }
        this.modelsFailed = false;
        return this.modelToken;
    }

    private applyModelsPage(page: WorkflowModelPage, more: boolean): void {
        this.rows = more ? [...this.rows, ...page.rows] : page.rows;
        this.cursor = page.cursor;
        this.hasMore = page.hasMoreItems;
        this.modelsLoading = false;
        this.loadingMore = false;
        if (this.status === "loading") {
            this.status = "ready";
        }
    }

    private applyModelsFailure(error: unknown): void {
        this.modelsLoading = false;
        this.loadingMore = false;
        if (this.status === "loading") {
            this.applyLoadFailure(error);
            return;
        }
        this.modelsFailed = true;
    }

    private applyLoadFailure(error: unknown): void {
        this.status = "failed";
        this.loadError = toMessage(error);
    }

    private async loadOptions(): Promise<void> {
        const token = this.beginOptionsLoad();
        const [types, automations, transports] = await Promise.allSettled([
            this.config.listStepTypes(),
            this.config.listAutomationDefinitions(),
            this.config.listNotificationTransports()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyCoreOptions(types, automations, transports);

        // The AI lists exist only with the AI editor (R275); without it they are not requested.
        if (!isAiEditable(this.stepTypes.items)) {
            this.applyAiNotRequested();
            return;
        }
        const [models, tools] = await Promise.allSettled([
            this.config.listAiModels(),
            this.config.listAiTools()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyAiOptions(models, tools);
    }

    private beginOptionsLoad(): number {
        this.optionsToken += 1;
        this.stepTypes = createOptionList("loading");
        this.automations = createOptionList("loading");
        this.transports = createOptionList("loading");
        this.aiModels = createOptionList("loading");
        this.aiTools = createOptionList("loading");
        return this.optionsToken;
    }

    private applyCoreOptions(
        types: PromiseSettledResult<EditorStepType[]>,
        automations: PromiseSettledResult<AutomationDefinition[]>,
        transports: PromiseSettledResult<NotificationTransport[]>
    ): void {
        this.stepTypes = toOptionList(types);
        this.automations = toOptionList(automations);
        this.transports = toOptionList(transports);
    }

    private applyAiNotRequested(): void {
        this.aiModels = createOptionList("ready");
        this.aiTools = createOptionList("ready");
    }

    private applyAiOptions(
        models: PromiseSettledResult<AiModel[]>,
        tools: PromiseSettledResult<AiTool[]>
    ): void {
        this.aiModels = toOptionList(models);
        this.aiTools = toOptionList(tools);
    }

    private async openModel(modelId: string): Promise<void> {
        const params = this.params;
        const row = this.rows.find(item => item.modelId === modelId);
        if (params === null || !row) {
            return;
        }
        const token = this.beginOpen(row);
        if (row.workflow === null) {
            return;
        }
        try {
            const workflow = await params.useCases.getWorkflow(row.workflow.id);
            if (token !== this.selectToken) {
                return;
            }
            this.applyLoadedWorkflow(workflow, row.modelId);
        } catch (error) {
            if (token === this.selectToken) {
                this.applyOpenFailure(error, row.modelId);
            }
            return;
        }
        await this.resolveTeams();
    }

    private beginOpen(row: WorkflowModelRow): number {
        this.selectToken += 1;
        this.resolveToken += 1;
        this.selectedRow = row;
        this.draft.reset(null);
        this.nameError = null;
        this.pending = null;
        this.detail = row.workflow === null ? "empty" : "loading";
        return this.selectToken;
    }

    private applyLoadedWorkflow(workflow: EditorWorkflow, modelId: string): void {
        this.draft.reset(workflow);
        this.detail = "workflow";
        this.bindWorkflow(modelId, { id: workflow.id, name: workflow.name });
    }

    private applyOpenFailure(error: unknown, modelId: string): void {
        if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
            // The bound workflow was deleted since the list was read: the model has none.
            this.bindWorkflow(modelId, null);
            this.detail = "empty";
            return;
        }
        this.failedModelId = modelId;
        this.applyLoadFailure(error);
    }

    // Updates the row of a model (and the open row) after its bound workflow changed.
    private bindWorkflow(modelId: string, workflow: WorkflowModelRow["workflow"]): void {
        this.rows = this.rows.map(row => {
            return row.modelId === modelId ? { ...row, workflow } : row;
        });
        const selected = this.selectedRow;
        if (selected !== null && selected.modelId === modelId) {
            this.selectedRow = { ...selected, workflow };
        }
    }

    private async resolveTeams(): Promise<void> {
        const wanted = collectTeamIds(this.draft.steps, this.automations.items);
        const missing = wanted.filter(id => !this.teamsKnown.some(team => team.id === id));
        if (missing.length === 0) {
            return;
        }
        this.resolveToken += 1;
        const token = this.resolveToken;
        // The server refuses more than 200 ids (R268); the rest keep the Unknown item name.
        const ids = missing.slice(0, TEAM_IDS_LIMIT);
        try {
            const result = await this.config.listTeams({ search: null, ids, limit: null });
            if (token === this.resolveToken) {
                this.applyResolvedTeams(result.teams);
            }
        } catch {
            if (token === this.resolveToken) {
                this.teamsFailed = true;
            }
        }
    }

    private applyResolvedTeams(teams: WorkflowTeamSummary[]): void {
        this.teamsFailed = false;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
    }
}

export const WorkflowEditorPresenter = Abstraction.createImplementation({
    implementation: WorkflowEditorPresenterImpl,
    dependencies: [WorkflowConfigUseCases, IdentityContext]
});
```

Create `packages/app-workflows/src/editor/presentation/editor/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorPresenter as Abstraction } from "./abstractions.js";
import { WorkflowEditorPresenter } from "./WorkflowEditorPresenter.js";

// Transient (R212): every `useFeature` resolve is a new presenter, so views never share state.
export const WorkflowEditorPresenterFeature = createFeature({
    name: "Workflows/WorkflowEditorPresenter",
    register(container) {
        container.register(WorkflowEditorPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/app.tsx`. Add the import after the `WorkflowsEditorPresenterFeature` import line (the old editor's, which Task 22 removes; do not touch it and do not import its token):

```ts
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
```

and register the feature after `<RegisterFeature feature={WorkflowEditorServicesFeature} />` (Task 5c added that line):

```tsx
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
            <RegisterFeature feature={WorkflowEditorPresenterFeature} />
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/optionLists.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getTeamSettingKeys.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/collectTeamIds.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildModelRowVms.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (1) `createFakeEditorUseCases` and `createFakeConfigUseCases` are Task 5's, so their defaults decide the bound row and the team names; if a default differs from `Article` / `Article review` / `team-1`, change the expected strings in these tests, not the presenter. (2) The model-list tests that use fake timers call `vi.useFakeTimers()` after `init` has settled, because `init` awaits promises only; `afterEach` restores real timers.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. `app.cleanup.test.tsx` still passes: the old editor is still registered.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow editor presenter shell" -m "The presenter gates on the editor permission, loads the model list with server search and load more, the step options with a status per list and the bound workflow into the draft, resolves the step team names and asks before leaving a dirty draft. The view gets render-ready view models only." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **VM names follow Tasks 15 and 16.** Task 15 (shell) reads `panel.showSearch`, `panel.emptyText`, `rows[].modelId` and `active`, `header.dirty` and `canSave`, `empty.description`, `setSearch`, `loadMore` and `selectModel(modelId)`. Task 15's `WorkflowEditorViewPresenter` is a structural subset of this presenter, so a mismatch is a type error on its `presenter={presenter}` line; the extra members here (`panel.error`, `detail`, `optionsBanner`, `dialog`) are for Tasks 17-19. Task 9b adds the step members Tasks 16 and 17 read.
- **`getOptions()` has a status per list (R284).** Task 14's `formOptions`, Task 13's failed AI list state and Task 11 and 12's renderers read `OptionList<T> { status, items }`; an empty `ready` list is never a failure.
- **Row icon.** `ModelRowVm` carries no icon; the view calls `app.renderModelIcon(row.modelId)`. Task 15 should test that a row renders it.
- **Workflow load failure is page-level.** Task 15 has states for loading, a failed page, no access and no workflow, but none for "this model's workflow did not load". A non-NotFound failure of `getWorkflow` therefore sets `vm.status` to `failed` (the page error with `Try again`, whose `retry()` re-initialises and reopens that model if it is on the first page). A `NotFound` unbinds the row and shows the empty state. While a workflow loads, `vm.detail` is `loading` and the right side is empty; Task 15 renders no skeleton for it, which is accepted.
- **Auto-open of the first model** is this task's choice: the design has no "no model chosen" state or copy. For the CMS the first row of the first page opens after init; for the WB the single `Pages` row opens.
- **A failed adapter init does not block the editor** (coordinator update to the contract): the CMS adapter's init lists models for the icons and a workflows editor may lack that permission, so icons stay empty.
- **WB panel label.** The fake adapter and the init test use `Website Builder` (R280: shown uppercase by the panel's style, `WEBSITE BUILDER`); Task 21's adapter uses the same string.
- **Dialog VM:** the contract says `vm.dialog: WorkflowEditorDialogVm | null` with "a `kind` plus its render-ready texts and button states"; this task fixes the shape (`kind`, `title`, `body`, `note`, `reviews`, `confirmLabel` (null: only the secondary button), `cancelLabel`, `destructive`, `cancelDestructive`, `busy`) and one kind. Task 9b adds `deleteStep`, Task 10 adds `conflict`, `deleted`, `deleteWorkflow`, `blockedDelete` and `reloadWorkflow`; the switch-automation confirmation of Task 12 is the drawer's. `cancelDialog()` is the secondary button of every kind.
- **Style note.** `loadModels`, `loadOptions`, `resolveTeams` and `openModel` are private methods that each call a use case and own the generation token and the state transition; they are shared by several callers (init, retry, search, load more) and are not thin wrappers around one call. A reviewer should confirm this reading of the "no wrapper" rule.
- **No new design copy.** Every string is from `research-spec.md` 4, the contract (R276, R279, R280, R281) or Task 8. The panel failure text `Could not load workflows` is the design's load-error title reused for a failed search or page; the failed-page description is the failure's own message (`Error.message`), shown by Task 15 as the error text.
- Size: medium (one presenter shell, the VM types, three small pure builders and seven test files).
