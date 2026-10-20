### Task 10: Target and request reviews inject their use cases; the workflow cache moves

R343, R349, R350, R352, R353, R355, R357, R360; Q69, Q70, Q73; Review Focus 2, 4, 8 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342 no behaviour change; one class per file; one named import per line; no inline object types; no nested call arguments; no wrapper helpers and no private methods around a dependency call; presenters own render-ready state, R234; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R220 (error classification stays in the presenters), R237 (still binding for `EditorReviewSession`, R347).

The editor review bar and the request dialog stop receiving review use cases at runtime: `TargetReviewPresenter` and `RequestReviewPresenter` inject exactly the use cases they call. The editor stops clearing the review UI's workflow cache by hand: `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` clear their app's list in `ReviewRepository` (R350), so `reviewUseCases` leaves the editor's init parameters, props and mounting features.

- **`TargetReviewPresenter`** (R352): dependencies `[GetBoundWorkflowUseCase, GetTargetReviewUseCase, EventPublisher, ReviewActivity, IdentityContext]` (the use cases first, the other dependencies in their old order). `refresh` calls `getBoundWorkflowUseCase.execute({ namespace: params.target.namespace })` and `getTargetReviewUseCase.execute(params.target)`. `TargetReviewInitParams` loses `useCases` (R353); its `target` carries the namespace. Subscriptions, the queued refresh, the token guards and the content reload stay as they are (Review Focus 4, R357); only the fakes in the tests change.
- **`RequestReviewPresenter`** (R352): dependencies `[GetBoundWorkflowUseCase, ListStepCandidatesUseCase, RequestReviewUseCase, ReviewerPickerFactory, ReviewToasts]`. The picks array is typed `RequestReviewUseCase.Params["picks"]` (R345: presenters reach parameter types only through `XUseCase.Params`). `RequestReviewInitParams` and `RequestReviewDialogProps` lose `useCases`; `ReviewBar` stops passing it to `RequestReviewDialog` and still passes `useCases` to `ReviewActionDialogs` until Task 11.
- **App glue** (R353): `getCmsEntryReviewInitParams` drops its `useCases` input and output; `CmsEntryFormPresenterReviewDecorator` stops passing `session.useCases`; WB `PageReviewBar` drops `useCases` from its `init` call. The editor sessions keep `useCases` until Task 11.
- **Workflow cache** (R350, Review Focus 2): `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` depend on `[WorkflowEditorRepository, ReviewRepository]`; after the store or delete succeeds they call `reviewRepository.invalidateWorkflows(params.app)`; when it throws a `GraphQLOperationError` with `code === WorkflowErrorCode.NotFound` they invalidate and rethrow; any other failure leaves the cache. `WorkflowEditorPresenter` drops its four `invalidateWorkflows` calls (`cancelDialog`, `persist`, `deleteCurrent`, `handleDeleteFailure`). The "deleted" dialog of a store that found the workflow gone no longer clears the cache when it is dismissed: the store already did when it failed, which leaves the same cache state (R350).
- **Editor mounting** (R353, R354, R349): `WorkflowEditorInitParams`, `WorkflowEditorViewProps` and `WorkflowEditorRouteProps` keep only `app`; `CmsWorkflowEditor` and `WebsiteBuilderWorkflowsMenu` pass only `app`; `CmsWorkflowEditorMountingFeature` and `WbWorkflowEditorMountingFeature` resolve `{ app }` (no use case resolves in the plugin pass).
- **Tests (R355).** Each presenter test registers one fresh `{ execute: vi.fn() }` per injected use case and reads it by name (`setup.getTargetReview.execute`); the behaviour assertions stay. The presenter tests that asserted `invalidateWorkflows` drop that line; the assertion moves to `StoreWorkflowUseCase.test.ts` and `DeleteWorkflowUseCase.test.ts` (real `WorkflowEditorRepository` and `ReviewRepository` over fake gateways: after success and after `NotFound` only, the app's list only). `targetReviewFakes.ts` holds no use-case wiring (it fakes the presenter) and does not change.

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/requestReview/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.tsx`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`
- Modify: `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`
- Modify: `packages/app-workflows/src/editor/useCases/storeWorkflow/{abstractions.ts,StoreWorkflowUseCase.ts,StoreWorkflowUseCase.test.ts}`
- Modify: `packages/app-workflows/src/editor/useCases/deleteWorkflow/{abstractions.ts,DeleteWorkflowUseCase.ts,DeleteWorkflowUseCase.test.ts}`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`
- Modify: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`
- Modify (tests): `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`, `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts`, `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx`, `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`, `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`, `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts`, `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.{save,saveFailures,delete,overlap}.test.ts`, `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`, `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`, `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`, `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`, `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`, `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`, `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts`, `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`, `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx`, `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`, `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`, `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`

**Interfaces:**
- Consumes: Task 8 (`GetBoundWorkflowUseCase`, `GetTargetReviewUseCase`, `ListStepCandidatesUseCase` abstractions and their `Params`; `ReviewRepository` with `listWorkflows`, `invalidateWorkflows`; `ReviewRepositoryFeature`; `createFakeReviewGateway`, `createWorkflowDto`), Task 9 (`RequestReviewUseCase`), Task 5 (`WorkflowAppKind`; `StoreWorkflowUseCase` / `DeleteWorkflowUseCase` at `[AWE]/useCases/{storeWorkflow,deleteWorkflow}/` with `Params` `StoreWorkflowUseCaseParams extends StoreWorkflowParams { app }` and `DeleteWorkflowUseCaseParams { app; id }`; `WorkflowEditorRepository` at `[AWE]/repository/abstractions.ts` with `storeWorkflow(params)` and `deleteWorkflow(params)` returning `EditorWorkflow`; the routing `WorkflowEditorGateway` at `[AWE]/gateway/abstractions.ts` with `listModels`, `getWorkflow`, `storeWorkflow`, `deleteWorkflow`, `inspectRouting`, `folderExists` returning DTOs; `WorkflowEditorRepository.ts`), Task 6 (the editor presenter injects the six editor use cases and passes `app: params.app.appKind`; `WorkflowEditorInitParams { reviewUseCases; app }`; the mounting features resolve `{ reviewUseCases, app }`; `editorPresenterSetup` returns per-use-case fakes and still `reviewUseCases`). Existing (verified): `WorkflowErrorCode.NotFound` (`[AWE]/domain/WorkflowErrorCode.ts`), `GraphQLOperationError`, `createEditorWorkflow`, `createEditorWorkflowDto`, `EDITOR_SAVED_ON` (`[AWET]/editorFixtures.ts`), `createWorkflow` (`[AWRT]/createWorkflow.ts`), `TARGET` (`[AWRT]/reviewTarget.ts`), `createFakeUseCases` (still present until Task 14, used only where `ReviewActionDialogs` still needs a bundle).
- Produces (matches the contract): R352 rows for `TargetReviewPresenter`, `RequestReviewPresenter`, `WorkflowEditorPresenter` (no review dependency); R353: `TargetReviewInitParams`, `RequestReviewInitParams`, `RequestReviewDialogProps` without `useCases`; `WorkflowEditorInitParams { app }`; `CmsEntryReviewInitInput` without `useCases`; mounting features resolving `{ app }`; R350 in place.

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. Type check: `yarn build -p @webiny/<package> --no-cache`.

- [ ] **Step 1: Write the failing tests**

**1a. The store and delete use cases clear the cache (R350).** Replace `packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts` (written by Task 5) with:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as ReviewRepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Article review",
    models: ["cms.article"],
    steps: [
        {
            id: "step-1",
            title: "Editorial check",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

const params: UseCaseAbstraction.Params = { app: "cms", data: input, savedOn: EDITOR_SAVED_ON };

const failure = (code: string, data: unknown = null): GraphQLOperationError => {
    return new GraphQLOperationError({ message: "The store failed.", code, data });
};

describe("StoreWorkflowUseCase", () => {
    let editorGateway: FakeWorkflowEditorGateway;
    let reviewGateway: FakeReviewGateway;
    let reviewRepository: ReviewRepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    // Loads and caches both apps' workflow lists, as the review bars of two editors would.
    const primeBothLists = async (): Promise<void> => {
        await reviewRepository.listWorkflows("cms.article");
        await reviewRepository.listWorkflows("wb.page");
    };

    const listLoadsOf = (app: string): number => {
        return reviewGateway.listWorkflows.mock.calls.filter(call => call[0] === app).length;
    };

    beforeEach(() => {
        editorGateway = createFakeEditorGateway();
        reviewGateway = createFakeReviewGateway();
        const cmsWorkflow = createWorkflowDto("workflow-1", ["cms.article"]);
        reviewGateway.listWorkflows.mockResolvedValue([cmsWorkflow]);
        const container = new Container();
        container.registerInstance(WorkflowEditorGateway, editorGateway);
        container.registerInstance(ReviewGateway, reviewGateway);
        container.register(WorkflowEditorRepository).inSingletonScope();
        container.register(ReviewRepository).inSingletonScope();
        container.register(StoreWorkflowUseCase);
        reviewRepository = container.resolve(ReviewRepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("sends the data and the loaded savedOn string unchanged with the app (D131)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        await useCase.execute(params);

        expect(editorGateway.storeWorkflow).toHaveBeenCalledTimes(1);
        const sent = editorGateway.storeWorkflow.mock.calls[0][0];
        expect(sent).toBe(params);
        expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("sends null for a new workflow", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        await useCase.execute({ app: "wb", data: input, savedOn: null });

        const sent = editorGateway.storeWorkflow.mock.calls[0][0];
        expect(sent.savedOn).toBeNull();
        expect(sent.app).toBe("wb");
    });

    it("returns the stored workflow with the new savedOn string unchanged", async () => {
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" });
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        const workflow = await useCase.execute(params);

        expect(workflow).toEqual(createEditorWorkflow({ savedOn: "2026-10-18T11:30:00.456Z" }));
    });

    it("clears the app's workflow list after a successful store, and only that app's (R350)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute(params);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("clears the Website Builder list for a Website Builder store", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute({ ...params, app: "wb" });
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(2);
    });

    it("clears the app's list when the server says the workflow is gone, and rethrows (R350)", async () => {
        const gone = failure(WorkflowErrorCode.NotFound, { id: "workflow-1" });
        editorGateway.storeWorkflow.mockRejectedValue(gone);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(gone);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("keeps the cache after a conflict, a validation error or a transport failure", async () => {
        const conflict = failure(WorkflowErrorCode.Conflict, { savedOn: "2026-10-18T10:00:00.000Z" });
        const validation = failure(WorkflowErrorCode.Validation, {
            stepId: "step-1",
            field: "config.teams",
            workflowId: null
        });
        const transport = new Error("Network down.");
        editorGateway.storeWorkflow.mockRejectedValueOnce(conflict);
        editorGateway.storeWorkflow.mockRejectedValueOnce(validation);
        editorGateway.storeWorkflow.mockRejectedValueOnce(transport);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(conflict);
        await expect(useCase.execute(params)).rejects.toBe(validation);
        await expect(useCase.execute(params)).rejects.toBe(transport);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("keeps the code and the data of a conflict for the editor's banner", async () => {
        const conflict = failure(WorkflowErrorCode.Conflict, {
            savedOn: "2026-10-18T10:00:00.000Z",
            savedBy: { id: "user-2", displayName: "Grace" }
        });
        editorGateway.storeWorkflow.mockRejectedValue(conflict);

        await expect(useCase.execute(params)).rejects.toMatchObject({
            code: WorkflowErrorCode.Conflict,
            data: { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { id: "user-2", displayName: "Grace" } }
        });
    });
});
```

Replace `packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts` (written by Task 5) with:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as ReviewRepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

const params: UseCaseAbstraction.Params = { app: "cms", id: "workflow-1" };

describe("DeleteWorkflowUseCase", () => {
    let editorGateway: FakeWorkflowEditorGateway;
    let reviewGateway: FakeReviewGateway;
    let reviewRepository: ReviewRepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    const primeBothLists = async (): Promise<void> => {
        await reviewRepository.listWorkflows("cms.article");
        await reviewRepository.listWorkflows("wb.page");
    };

    const listLoadsOf = (app: string): number => {
        return reviewGateway.listWorkflows.mock.calls.filter(call => call[0] === app).length;
    };

    beforeEach(() => {
        editorGateway = createFakeEditorGateway();
        reviewGateway = createFakeReviewGateway();
        const cmsWorkflow = createWorkflowDto("workflow-1", ["cms.article"]);
        reviewGateway.listWorkflows.mockResolvedValue([cmsWorkflow]);
        const container = new Container();
        container.registerInstance(WorkflowEditorGateway, editorGateway);
        container.registerInstance(ReviewGateway, reviewGateway);
        container.register(WorkflowEditorRepository).inSingletonScope();
        container.register(ReviewRepository).inSingletonScope();
        container.register(DeleteWorkflowUseCase);
        reviewRepository = container.resolve(ReviewRepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the app and the id and maps the deleted workflow", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.deleteWorkflow.mockResolvedValue(dto);

        const workflow = await useCase.execute(params);

        expect(editorGateway.deleteWorkflow).toHaveBeenCalledWith(params);
        expect(workflow.id).toBe("workflow-1");
    });

    it("clears the app's workflow list after a successful delete, and only that app's (R350)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.deleteWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute(params);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("clears the app's list when the workflow was already gone, and rethrows (R350)", async () => {
        const gone = new GraphQLOperationError({
            message: "Not found.",
            code: WorkflowErrorCode.NotFound,
            data: { id: "workflow-1" }
        });
        editorGateway.deleteWorkflow.mockRejectedValue(gone);
        await primeBothLists();

        await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(gone);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(2);
    });

    it("keeps the cache for a blocked delete and keeps its count and reviews", async () => {
        const data = { count: 2, reviews: [{ reviewId: "review-1", title: "Spring campaign" }] };
        const blocked = new GraphQLOperationError({
            message: "The workflow has reviews in progress.",
            code: WorkflowErrorCode.HasActiveReviews,
            data
        });
        editorGateway.deleteWorkflow.mockRejectedValue(blocked);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(blocked);
        expect(blocked).toMatchObject({ code: WorkflowErrorCode.HasActiveReviews, data });
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
    });

    it("keeps the cache after a transport failure", async () => {
        const transport = new Error("Failed to fetch");
        editorGateway.deleteWorkflow.mockRejectedValue(transport);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(transport);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(1);
    });
});
```

**1b. `TargetReviewPresenter.test.ts` injects two fakes.** Pattern for the whole file (`packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`): the test helpers own one fresh `{ execute }` fake per injected use case; `createParams` loses its first argument; every `useCases.X` becomes `setup.X.execute`. Apply the mechanical part with `sed`, then the three hunks below by hand.

```bash
F=packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts
sed -i '' \
  -e 's/useCases\.getTargetReview/setup.getTargetReview.execute/g' \
  -e 's/useCases\.getBoundWorkflow/setup.getBoundWorkflow.execute/g' \
  -e 's/createParams(useCases, /createParams(/g' \
  -e 's/createParams(useCases)/createParams()/g' \
  -e '/^    let useCases: FakeReviewUseCases;$/d' \
  -e '/^        useCases = createFakeUseCases();$/d' \
  "$F"
grep -n "useCases\|UseCases" "$F"
```

After the `sed`, the `grep` lists only the lines the hunks below replace (the imports, `createParams`, the two tests with `oldUseCases`/`newUseCases` and `otherUseCases`).

Imports, before:

```ts
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";
```

After:

```ts
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
```

Before:

```ts
const createParams = (
    useCases: FakeReviewUseCases,
    overrides: Partial<TargetReviewInitParams> = {}
): TargetReviewInitParams => {
    return {
        useCases,
        target: TARGET,
```

After:

```ts
const createParams = (overrides: Partial<TargetReviewInitParams> = {}): TargetReviewInitParams => {
    return {
        target: TARGET,
```

Before:

```ts
const createSetup = (teams: ITeam[] = []) => {
    const container = new Container();
    const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
    const activity = createFakeActivity();
    container.registerInstance(EventPublisher, publisher);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createIdentityContext(teams));
    TargetReviewPresenterFeature.register(container);
    const { presenter } = TargetReviewPresenterFeature.resolve(container);
    return { container, presenter, publisher, activity };
};
```

After:

```ts
// One fake per injected use case (R355): the namespace has a workflow, the revision no review.
const createSetup = (teams: ITeam[] = []) => {
    const container = new Container();
    const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
    const activity = createFakeActivity();
    const workflow = createWorkflow();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(workflow)
    };
    const getTargetReview = {
        execute: vi.fn<GetTargetReviewUseCase.Interface["execute"]>().mockResolvedValue(null)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(GetTargetReviewUseCase, getTargetReview);
    container.registerInstance(EventPublisher, publisher);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createIdentityContext(teams));
    TargetReviewPresenterFeature.register(container);
    const { presenter } = TargetReviewPresenterFeature.resolve(container);
    return { container, presenter, publisher, activity, getBoundWorkflow, getTargetReview };
};
```

The bound-workflow assertion now names the use case's parameter object. Before (after the `sed`):

```ts
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith(TARGET.namespace);
```

After:

```ts
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: TARGET.namespace });
```

The second-init test kept two bundles for two targets; one injected use case answers them in order now. Before:

```ts
    it("ignores the response of an old target after a second init (Review Focus 5)", async () => {
        const oldReview = createDeferred<ReviewWithFlags | null>();
        const oldUseCases = createFakeUseCases();
        oldUseCases.getTargetReview.mockReturnValue(oldReview.promise);
        const pending = setup.presenter.init(createParams(oldUseCases));
        await vi.waitFor(() => expect(oldUseCases.getTargetReview).toHaveBeenCalled());

        const newUseCases = createFakeUseCases();
        newUseCases.getTargetReview.mockResolvedValue(null);
        await setup.presenter.init(
            createParams(newUseCases, {
                target: { namespace: TARGET.namespace, targetRevisionId: "entry-2#0001" }
            })
        );
```

After:

```ts
    it("ignores the response of an old target after a second init (Review Focus 5)", async () => {
        const oldReview = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValueOnce(oldReview.promise);
        setup.getTargetReview.execute.mockResolvedValueOnce(null);
        const pending = setup.presenter.init(createParams());
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1));

        await setup.presenter.init(
            createParams({
                target: { namespace: TARGET.namespace, targetRevisionId: "entry-2#0001" }
            })
        );
```

The independence test used two bundles; two presenters from two containers keep it meaningful. Before:

```ts
    it("keeps two presenters with two use cases independent (Review Focus 1)", async () => {
        const second = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        const otherUseCases = createFakeUseCases();
        otherUseCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(createParams());
        await second.init(createParams(otherUseCases));

        expect(second).not.toBe(setup.presenter);
        expect(setup.presenter.vm.status).toBe("none");
        expect(second.vm.status).toBe("noWorkflow");
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(otherUseCases.getBoundWorkflow).toHaveBeenCalledTimes(1);
    });
```

After:

```ts
    it("keeps two presenters independent (Review Focus 1)", async () => {
        const other = createSetup();
        other.getBoundWorkflow.execute.mockResolvedValue(null);

        await setup.presenter.init(createParams());
        await other.presenter.init(createParams());

        expect(other.presenter).not.toBe(setup.presenter);
        expect(setup.presenter.vm.status).toBe("none");
        expect(other.presenter.vm.status).toBe("noWorkflow");
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(other.getBoundWorkflow.execute).toHaveBeenCalledTimes(1);
    });
```

Add one wiring case at the end of the first `describe("TargetReviewPresenter", ...)` (before its closing `});`, which precedes the live-refresh `describe`):

```ts
    it("reads the bound workflow and the target review through its two injected use cases (R352)", async () => {
        await setup.presenter.init(createParams());

        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: TARGET.namespace });
        expect(setup.getTargetReview.execute).toHaveBeenCalledWith(TARGET);
        expect(Object.keys(createParams())).not.toContain("useCases");
    });
```

**1c. `RequestReviewPresenter.test.ts`.** Pattern: `setup.useCases.X` -> `setup.X.execute` and `other.useCases.X` -> `other.X.execute` for `getBoundWorkflow`, `listStepCandidates`, `requestReview`:

```bash
F=packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts
sed -i '' -E \
  -e 's/(setup|other)\.useCases\.getBoundWorkflow/\1.getBoundWorkflow.execute/g' \
  -e 's/(setup|other)\.useCases\.listStepCandidates/\1.listStepCandidates.execute/g' \
  -e 's/(setup|other)\.useCases\.requestReview/\1.requestReview.execute/g' \
  "$F"
grep -n "useCases" "$F"
```

The `grep` then lists only the `Setup` interface and `createSetup`, replaced below.

Imports, before:

```ts
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";
```

After:

```ts
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
```

(If `createReview` is already imported in the file, keep one import.)

Before:

```ts
interface Setup {
    presenter: ReturnType<typeof RequestReviewPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
```

After:

```ts
interface GetBoundWorkflowFake {
    execute: Mock<GetBoundWorkflowUseCase.Interface["execute"]>;
}

interface ListStepCandidatesFake {
    execute: Mock<ListStepCandidatesUseCase.Interface["execute"]>;
}

interface RequestReviewFake {
    execute: Mock<RequestReviewUseCase.Interface["execute"]>;
}

interface Setup {
    presenter: ReturnType<typeof RequestReviewPresenterFeature.resolve>["presenter"];
    getBoundWorkflow: GetBoundWorkflowFake;
    listStepCandidates: ListStepCandidatesFake;
    requestReview: RequestReviewFake;
    toasts: { show: ReturnType<typeof vi.fn> };
```

(Add `import type { Mock } from "vitest";` to the vitest imports.)

Before:

```ts
const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    const { presenter } = RequestReviewPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getBoundWorkflow.mockResolvedValue(WORKFLOW);
    useCases.listStepCandidates.mockResolvedValue(PEOPLE);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: (overrides = {}) => ({
            useCases,
            target: TARGET,
```

After:

```ts
// One fake per injected use case (R355).
const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    const review = createReview();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(WORKFLOW)
    };
    const listStepCandidates = {
        execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue(PEOPLE)
    };
    const requestReview = {
        execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(ListStepCandidatesUseCase, listStepCandidates);
    container.registerInstance(RequestReviewUseCase, requestReview);
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    const { presenter } = RequestReviewPresenterFeature.resolve(container);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        getBoundWorkflow,
        listStepCandidates,
        requestReview,
        toasts,
        onDone,
        onClose,
        params: (overrides = {}) => ({
            target: TARGET,
```

Before (after the `sed`):

```ts
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith(TARGET.namespace);
```

After:

```ts
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: TARGET.namespace });
```

**1d. `RequestReviewDialog.test.tsx`.** The dialog's presenter reads its use cases from the container now.

Imports, before:

```ts
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
```

After:

```ts
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
```

Replace `createContainer`, `createUseCases` and `renderDialog` (from `const createContainer = () => {` to the end of `renderDialog`) with:

```tsx
// One fake per use case the request presenter injects (R355).
const createUseCaseFakes = () => {
    const workflow = createWorkflow({
        steps: [
            {
                id: "editorial",
                title: "Editorial check",
                color: "#FA5723",
                description: "Reads the copy.",
                type: "review",
                allowManualPick: true,
                assignedAutomatically: false
            },
            {
                id: "tone",
                title: "AI tone check",
                color: "#7C3AED",
                description: null,
                type: "ai",
                allowManualPick: false,
                assignedAutomatically: false
            }
        ]
    });
    const review = createReview();
    return {
        getBoundWorkflow: {
            execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(workflow)
        },
        listStepCandidates: {
            execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue([
                { id: "u1", displayName: "Ivan Horvat", excluded: false, excludedReason: null }
            ])
        },
        requestReview: {
            execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
        }
    };
};

type UseCaseFakes = ReturnType<typeof createUseCaseFakes>;

const createContainer = (fakes: UseCaseFakes) => {
    const container = new Container();
    container.registerInstance(GetBoundWorkflowUseCase, fakes.getBoundWorkflow);
    container.registerInstance(ListStepCandidatesUseCase, fakes.listStepCandidates);
    container.registerInstance(RequestReviewUseCase, fakes.requestReview);
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    return container;
};

const renderDialog = (fakes = createUseCaseFakes(), onClose = vi.fn(), onDone = vi.fn()) => {
    renderWithContainer(
        <RequestReviewDialog
            target={TARGET}
            targetTitle={"Spring campaign"}
            reviewsUrl={null}
            onDone={onDone}
            onClose={onClose}
        />,
        createContainer(fakes)
    );
    return { fakes, onClose, onDone };
};
```

Then in the cases, before / after:

- `const useCases = createUseCases();` -> `const fakes = createUseCaseFakes();`
- `useCases.listStepCandidates.mockReturnValue(` -> `fakes.listStepCandidates.execute.mockReturnValue(`
- `useCases.listStepCandidates.mockResolvedValue(` -> `fakes.listStepCandidates.execute.mockResolvedValue(`
- `useCases.getBoundWorkflow.mockRejectedValueOnce(` -> `fakes.getBoundWorkflow.execute.mockRejectedValueOnce(`
- `renderDialog(useCases);` -> `renderDialog(fakes);`
- `expect(useCases.listStepCandidates).toHaveBeenCalled()` -> `expect(fakes.listStepCandidates.execute).toHaveBeenCalled()`

The last case mounts the dialog through `ReviewBar`, which still takes the review bundle for its action dialogs until Task 11. Before:

```tsx
        renderWithContainer(
            <ReviewBar presenter={presenter} useCases={createUseCases()} reviewsUrl={null} />,
            createContainer()
        );
```

After:

```tsx
        const bundle = createFakeUseCases();
        const fakes = createUseCaseFakes();
        renderWithContainer(
            <ReviewBar presenter={presenter} useCases={bundle} reviewsUrl={null} />,
            createContainer(fakes)
        );
```

**1e. `ReviewBar.test.tsx` "refreshes the bar when the request dialog hits a conflict".** Before:

```tsx
        const container = new Container();
        container.registerInstance(ReviewToasts, { show: vi.fn() });
        ReviewerPickerPresenterFeature.register(container);
        RequestReviewPresenterFeature.register(container);
```

After:

```tsx
        const container = new Container();
        const workflow = createWorkflow();
        const conflict = new GraphQLOperationError({
            message: "Active.",
            code: ReviewErrorCode.AlreadyActive
        });
        const getBoundWorkflow = {
            execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(workflow)
        };
        const listStepCandidates = {
            execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue([])
        };
        const requestReview = {
            execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockRejectedValue(conflict)
        };
        container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
        container.registerInstance(ListStepCandidatesUseCase, listStepCandidates);
        container.registerInstance(RequestReviewUseCase, requestReview);
        container.registerInstance(ReviewToasts, { show: vi.fn() });
        ReviewerPickerPresenterFeature.register(container);
        RequestReviewPresenterFeature.register(container);
```

Before:

```tsx
        const useCases = createFakeUseCases();
        useCases.requestReview.mockRejectedValue(
            new GraphQLOperationError({
                message: "Active.",
                code: ReviewErrorCode.AlreadyActive
            })
        );
        renderWithContainer(
```

After:

```tsx
        const useCases = createFakeUseCases();
        renderWithContainer(
```

Add the imports:

```ts
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
```

(The conflict is built first and the fakes are named constants, so no call is nested in another call's arguments.)

**1f. `EditorReviewSession.test.ts`.** The shared session's `TargetReviewPresenter` is the real one, so its container needs the two use cases; the per-app bundles stay on the session until Task 11.

Imports, before:

```ts
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
```

After:

```ts
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
```

Before:

```ts
const createContainer = () => {
    const container = new Container();
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
```

After:

```ts
// The bound workflow per namespace: the page namespace has none (R347 routes it by namespace).
const readBoundWorkflow = async (params: GetBoundWorkflowUseCase.Params) => {
    if (params.namespace === "wb.page") {
        return null;
    }
    return createWorkflow();
};

const createContainer = () => {
    const container = new Container();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>(readBoundWorkflow)
    };
    const getTargetReview = {
        execute: vi.fn<GetTargetReviewUseCase.Interface["execute"]>().mockResolvedValue(null)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(GetTargetReviewUseCase, getTargetReview);
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
```

and at the end of `createContainer`, before:

```ts
    container.register(WbPageReviewSession).inSingletonScope();
    return container;
};
```

After:

```ts
    container.register(WbPageReviewSession).inSingletonScope();
    return { container, getBoundWorkflow };
};
```

In the three cases that call it (the two-app, singleton and dispose cases), `const container = createContainer();` becomes `const { container } = createContainer();`, except the two-app case, which becomes `const { container, getBoundWorkflow } = createContainer();`. In every `presenter.init({ ... })` call delete the `useCases: ...,` line (three calls). In the two-app case, before:

```ts
        expect(cmsUseCases.getBoundWorkflow).toHaveBeenCalledWith("cms.article");
        expect(wbUseCases.getBoundWorkflow).toHaveBeenCalledWith("wb.page");
    });
```

After:

```ts
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "cms.article" });
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "wb.page" });
        expect(cmsUseCases.getBoundWorkflow).not.toHaveBeenCalled();
        expect(wbUseCases.getBoundWorkflow).not.toHaveBeenCalled();
    });
```

and delete `wbUseCases.getBoundWorkflow.mockResolvedValue(null);` (the injected fake answers `null` for the page namespace).

**1g. Editor presenter tests drop the cache assertions (moved to 1a).** Files: `WorkflowEditorPresenter.save.test.ts`, `WorkflowEditorPresenter.saveFailures.test.ts`, `WorkflowEditorPresenter.delete.test.ts`, `WorkflowEditorPresenter.overlap.test.ts` (in `packages/app-workflows/src/editor/presentation/editor/`). Pattern per file, on the text as Task 6 left it:

1. Delete every line `expect(reviewUseCases.invalidateWorkflows)...;` (12 lines: save 3, saveFailures 3, delete 5, overlap 1).
2. Remove `reviewUseCases` from the setup destructuring of those cases (`const { presenter, ..., reviewUseCases, ... } = ...` keeps every other name).
3. Rename the case titles that promised the cache clear:

| File | Before | After |
|---|---|---|
| save | `makes the returned workflow the baseline, updates the row, clears the review cache and toasts` | `makes the returned workflow the baseline, updates the row and toasts` |
| save | `clears the review cache even when the editor was disposed while the store ran` | `toasts nothing when the editor was disposed while the store ran` |
| overlap | `clears the review cache even when applying the saved workflow throws` | `rejects when applying the saved workflow throws` |
| saveFailures | `discards: the draft closes, the model shows its empty state and the review cache is cleared` | `discards: the draft closes and the model shows its empty state` |
| saveFailures | `saves as new: the same id, a null savedOn, then the success toast and the cache clear` | `saves as new: the same id, a null savedOn, then the success toast` |
| delete | `deletes on confirm: closes the draft, unbinds the row, clears the review cache and toasts` | `deletes on confirm: closes the draft, unbinds the row and toasts` |
| delete | `clears the review cache even when the editor was disposed while the delete ran` | `toasts nothing when the editor was disposed while the delete ran` |

Worked example (`WorkflowEditorPresenter.overlap.test.ts`, the "rejects" case; the store fake's name is Task 6's, shown here as `storeWorkflow.execute`). Before:

```ts
    it("clears the review cache even when applying the saved workflow throws", async () => {
        const { presenter, storeWorkflow, reviewUseCases } = await dirtySetup();
        // A workflow without steps makes the draft reset throw.
        storeWorkflow.execute.mockResolvedValue(null as unknown as EditorWorkflow);

        await expect(presenter.save()).rejects.toThrow();

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
    });
```

After:

```ts
    it("rejects when applying the saved workflow throws", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        // A workflow without steps makes the draft reset throw.
        storeWorkflow.execute.mockResolvedValue(null as unknown as EditorWorkflow);

        await expect(presenter.save()).rejects.toThrow();

        expect(presenter.vm.header).toMatchObject({ saving: false });
    });
```

(The one case whose only assertion was the cache clear keeps a behaviour assertion: the editor is not left saving.)

Check after the edit:

```bash
grep -rn "reviewUseCases\|invalidateWorkflows" packages/app-workflows/src/editor
```

Expected: no hit outside `WorkflowEditorPresenter.ts`, `abstractions.ts`, `WorkflowEditorView.tsx`, `WorkflowEditorRoute.tsx`, `editorPresenterSetup.ts` and their tests listed in 1h, all changed below.

**1h. Editor kit, view, route and mounting tests drop `reviewUseCases`.** Pattern for each file, on the text as Task 6 left it: delete the `reviewUseCases` fake (`const reviewUseCases = ...;`), its registration (`container.registerInstance(CmsReviewUseCases | WbReviewUseCases, reviewUseCases);`), its field in a props or params literal (`reviewUseCases,` / `reviewUseCases={reviewUseCases}`), its assertion (`expect(...reviewUseCases).toBe(reviewUseCases);`) and the imports that become unused (`createFakeUseCases`, `FakeReviewUseCases`, `IReviewReadUseCases`, `CmsReviewUseCases`, `WbReviewUseCases`). Files:

- `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts` (the `reviewUseCases: FakeReviewUseCases;` field of `EditorPresenterSetup`, the fake, `params` becomes `const params: WorkflowEditorInitParams = { app };`, the return object loses `reviewUseCases`).
- `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx` (`init` is called with `{ app }`).
- `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`.
- `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`, `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`.
- `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`, `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`.

Worked example, `WorkflowEditorView.test.tsx`. Before (as Task 6 left it):

```tsx
const reviewUseCases = { name: "review use cases" } as unknown as IReviewReadUseCases;
```

After: the line is deleted. Before:

```tsx
            <WorkflowEditorView reviewUseCases={reviewUseCases} app={app} />,
```

After (five places):

```tsx
            <WorkflowEditorView app={app} />,
```

Before:

```tsx
        expect(init).toHaveBeenCalledWith({ reviewUseCases, app });
```

After:

```tsx
        expect(init).toHaveBeenCalledWith({ app });
```

Worked example, `[CMS]/features/editorMounting/feature.test.ts`: the resolve case becomes (replace the first `it(...)` of the file, whatever title Task 6 gave it):

```ts
    it("resolves only the app adapter for the view: no use case in the plugin pass (R349, R354)", () => {
        const { container } = createContainer();

        const resolved = CmsWorkflowEditorMountingFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["app"]);
        expect(resolved.app.appKind).toBe("cms");
        expect(resolved.app.contentAdapter).toBe(contentAdapter);
    });
```

and `createContainer` returns `{ container, client }`. The WB file gets the same case with `WbWorkflowEditorMountingFeature`, `appKind` `"wb"` and its own `contentAdapter` assertion as its current case makes it.

Worked example, `WorkflowEditorRoute.test.tsx`: the props case becomes

```tsx
    it("gives the view the app adapter as its only prop", async () => {
        const items = await mount();
        const element = getEditorElement(items);

        const views = findElements(element, WorkflowEditorView);
        const noAccess = findElements(element, EditorNoPermission);

        expect(views).toHaveLength(1);
        expect(noAccess).toHaveLength(0);
        expect(Object.keys(views[0].props)).toEqual(["app"]);
        expect(views[0].props.app).toBe(app);
    });
```

The CMS and WB route tests' props case (`CmsWorkflowEditor.test.tsx` and `WebsiteBuilderWorkflowsMenu.test.tsx`, `expect(views[0].props.reviewUseCases)...`) assert `expect(Object.keys(views[0].props)).toEqual(["app"]);` in place of the `reviewUseCases` line.

**1i. App glue tests drop `useCases` from the init parameters.**

`packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts`, before:

```ts
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { createEntry } from "~/testing/createEntry.js";
```

After:

```ts
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import { createEntry } from "~/testing/createEntry.js";
```

Before:

```ts
    it("builds the target, the context and carries the use cases and the reloader", () => {
        const useCases = createFakeUseCases();
        const contentReloader: IReviewContentReloader = { reload: vi.fn() };

        const params = getCmsEntryReviewInitParams({
            model: MODEL,
            entry: createEntry({ status: "published" }),
            useCases,
            canRequest: true,
            contentReloader
        });

        expect(params.useCases).toBe(useCases);
        expect(params.contentReloader).toBe(contentReloader);
```

After:

```ts
    it("builds the target and the context and carries the reloader, no use cases (R353)", () => {
        const contentReloader: IReviewContentReloader = { reload: vi.fn() };
        const entry = createEntry({ status: "published" });

        const params = getCmsEntryReviewInitParams({
            model: MODEL,
            entry,
            canRequest: true,
            contentReloader
        });

        expect(params).not.toHaveProperty("useCases");
        expect(params.contentReloader).toBe(contentReloader);
```

`packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`: delete the line `            useCases: fake.useCases,` from the `toHaveBeenCalledWith({...})` of "initialises the shared presenter with the revision that was loaded" (the exact object match now proves no `useCases` is passed).

`packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx`, before:

```tsx
        const { presenter, useCases } = mountBar();

        expect(presenter.init).toHaveBeenCalledTimes(1);
        const params = presenter.init.mock.calls[0][0];
        expect(params.useCases).toBe(useCases);
```

After:

```tsx
        const { presenter } = mountBar();

        expect(presenter.init).toHaveBeenCalledTimes(1);
        const params = presenter.init.mock.calls[0][0];
        expect(params).not.toHaveProperty("useCases");
```

`packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`: in the two cases at lines 105-130, `const { presenter, useCases } = mountTopBar(...)` becomes `const { presenter } = mountTopBar(...)` and the `useCases,` line of each `toHaveBeenCalledWith({...})` is deleted.

**1j. The CMS and WB editor gateway feature tests register the review repository.** Task 6's `[CMS|WB]/features/editorGateway/feature.test.ts` resolve `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` over the app's real gateway; after 3d both depend on `ReviewRepository`, so the nested `beforeEach` registers `ReviewRepositoryFeature` (the routing `ReviewGateway` resolves with no app gateway and is never called: `invalidateWorkflows` only drops a map entry). In both files (as Task 6 wrote them), imports, before:

```ts
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
```

After:

```ts
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { ReviewRepositoryFeature } from "@webiny/app-workflows/review/repository/feature.js";
```

Before:

```ts
        beforeEach(() => {
            WorkflowEditorRepositoryFeature.register(container);
            ListWorkflowModelsFeature.register(container);
```

After:

```ts
        beforeEach(() => {
            WorkflowEditorRepositoryFeature.register(container);
            // The store and delete use cases clear the review workflow cache (R350).
            ReviewRepositoryFeature.register(container);
            ListWorkflowModelsFeature.register(container);
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx 2>&1 | tail -30
```

Expected: the store and delete tests fail on the cache cases (`listLoadsOf("cms")` is 1, the use cases do not invalidate yet). The presenter tests fail: `params.useCases` is `undefined`, so `TargetReviewPresenter.refresh` throws `Cannot read properties of undefined (reading 'getBoundWorkflow')` and the injected fakes are never called. The dialog and bar tests fail the same way. `EditorReviewSession.test.ts` fails its two-app case (the presenters still call the bundles). The route, view and mounting tests fail on the props and resolve shapes (`reviewUseCases` still present). The glue tests fail on `toHaveProperty("useCases")` and the exact `toHaveBeenCalledWith` objects. Record the RED output.

- [ ] **Step 3: Implement**

**3a. `TargetReviewPresenter`.** Modify `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`.

Before:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewTarget } from "~/review/domain/types.js";
```

After:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
```

Before:

```ts
export interface TargetReviewInitParams extends TargetReviewContext {
    useCases: IReviewUseCases;
    target: ReviewTarget;
```

After:

```ts
// The presenter injects its use cases (R352); the target names the namespace they route by.
export interface TargetReviewInitParams extends TargetReviewContext {
    target: ReviewTarget;
```

Modify `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`.

Before:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
```

After:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
```

Before:

```ts
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            TargetReviewPresenterImpl,
            | "eventPublisher"
```

After:

```ts
    constructor(
        private getBoundWorkflowUseCase: GetBoundWorkflowUseCase.Interface,
        private getTargetReviewUseCase: GetTargetReviewUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            TargetReviewPresenterImpl,
            | "getBoundWorkflowUseCase"
            | "getTargetReviewUseCase"
            | "eventPublisher"
```

Before:

```ts
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
```

After:

```ts
        >(this, {
            getBoundWorkflowUseCase: false,
            getTargetReviewUseCase: false,
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
```

Before:

```ts
            const workflow = await params.useCases.getBoundWorkflow(params.target.namespace);
            if (token !== this.loadToken) {
                return;
            }
            hasWorkflow = workflow !== null;
            if (hasWorkflow) {
                review = await params.useCases.getTargetReview(params.target);
```

After:

```ts
            const workflow = await this.getBoundWorkflowUseCase.execute({
                namespace: params.target.namespace
            });
            if (token !== this.loadToken) {
                return;
            }
            hasWorkflow = workflow !== null;
            if (hasWorkflow) {
                review = await this.getTargetReviewUseCase.execute(params.target);
```

Before:

```ts
export const TargetReviewPresenter = Abstraction.createImplementation({
    implementation: TargetReviewPresenterImpl,
    dependencies: [EventPublisher, ReviewActivity, IdentityContext]
});
```

After:

```ts
export const TargetReviewPresenter = Abstraction.createImplementation({
    implementation: TargetReviewPresenterImpl,
    dependencies: [
        GetBoundWorkflowUseCase,
        GetTargetReviewUseCase,
        EventPublisher,
        ReviewActivity,
        IdentityContext
    ]
});
```

**3b. `RequestReviewPresenter`.** Modify `packages/app-workflows/src/review/presentation/requestReview/abstractions.ts`.

Before:

```ts
import type { ReviewTarget } from "~/review/domain/types.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

export interface RequestReviewInitParams {
    useCases: IReviewUseCases;
    target: ReviewTarget;
```

After:

```ts
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

export interface RequestReviewInitParams {
    target: ReviewTarget;
```

Modify `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.ts`.

Before:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { RequestReviewPick } from "~/review/appGateway/IReviewAppGateway.js";
import { REVIEW_TITLE_MIN_LENGTH } from "~/review/domain/constants.js";
```

After:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { REVIEW_TITLE_MIN_LENGTH } from "~/review/domain/constants.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
```

Before:

```ts
    constructor(
        private pickerFactory: ReviewerPickerFactory.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            RequestReviewPresenterImpl,
            "pickerFactory" | "toasts" | "token" | "params" | "workflow" | "pickers" | "modes"
        >(this, {
            pickerFactory: false,
```

After:

```ts
    constructor(
        private getBoundWorkflowUseCase: GetBoundWorkflowUseCase.Interface,
        private listStepCandidatesUseCase: ListStepCandidatesUseCase.Interface,
        private requestReviewUseCase: RequestReviewUseCase.Interface,
        private pickerFactory: ReviewerPickerFactory.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            RequestReviewPresenterImpl,
            | "getBoundWorkflowUseCase"
            | "listStepCandidatesUseCase"
            | "requestReviewUseCase"
            | "pickerFactory"
            | "toasts"
            | "token"
            | "params"
            | "workflow"
            | "pickers"
            | "modes"
        >(this, {
            getBoundWorkflowUseCase: false,
            listStepCandidatesUseCase: false,
            requestReviewUseCase: false,
            pickerFactory: false,
```

Before:

```ts
            const workflow = await params.useCases.getBoundWorkflow(params.target.namespace);
```

After:

```ts
            const workflow = await this.getBoundWorkflowUseCase.execute({
                namespace: params.target.namespace
            });
```

Before:

```ts
                    load: () =>
                        params.useCases.listStepCandidates({
                            workflowId: workflow.id,
                            stepId,
                            target: params.target
                        }),
```

After:

```ts
                    load: () =>
                        this.listStepCandidatesUseCase.execute({
                            workflowId: workflow.id,
                            stepId,
                            target: params.target
                        }),
```

Before:

```ts
        const picks: RequestReviewPick[] = [];
```

After:

```ts
        const picks: RequestReviewUseCase.Params["picks"] = [];
```

Before:

```ts
            await params.useCases.requestReview({
                target: params.target,
```

After:

```ts
            await this.requestReviewUseCase.execute({
                target: params.target,
```

Before:

```ts
export const RequestReviewPresenter = Abstraction.createImplementation({
    implementation: RequestReviewPresenterImpl,
    dependencies: [ReviewerPickerFactory, ReviewToasts]
});
```

After:

```ts
export const RequestReviewPresenter = Abstraction.createImplementation({
    implementation: RequestReviewPresenterImpl,
    dependencies: [
        GetBoundWorkflowUseCase,
        ListStepCandidatesUseCase,
        RequestReviewUseCase,
        ReviewerPickerFactory,
        ReviewToasts
    ]
});
```

Modify `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.tsx`.

Before:

```ts
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
```

After: the line is deleted.

Before:

```ts
export interface RequestReviewDialogProps {
    useCases: IReviewUseCases;
    target: ReviewTarget;
```

After:

```ts
export interface RequestReviewDialogProps {
    target: ReviewTarget;
```

Before:

```ts
    const { useCases, target, targetTitle, reviewsUrl, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(RequestReviewPresenterFeature);

    useEffect(() => {
        presenter.init({
            useCases,
            target,
```

After:

```ts
    const { target, targetTitle, reviewsUrl, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(RequestReviewPresenterFeature);

    useEffect(() => {
        presenter.init({
            target,
```

Modify `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`.

Before:

```ts
export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    // Used by the action dialogs mounted in Tasks 15 and 17.
    useCases: IReviewUseCases;
```

After:

```ts
export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    // The action dialogs still take the app's use cases; Task 11 replaces this by the namespace.
    useCases: IReviewUseCases;
```

Before:

```tsx
                <RequestReviewDialog
                    useCases={useCases}
                    target={target}
```

After:

```tsx
                <RequestReviewDialog
                    target={target}
```

**3c. App glue.** Modify `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts` (whole file after):

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import type { TargetReviewInitParams } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { getCmsEntryReviewContext } from "./getCmsEntryReviewContext.js";

export interface CmsEntryReviewInitInput {
    model: CmsModel;
    entry: CmsContentEntry;
    canRequest: boolean;
    contentReloader: IReviewContentReloader;
}

export function getCmsEntryReviewInitParams(
    input: CmsEntryReviewInitInput
): TargetReviewInitParams {
    const { model, entry, canRequest, contentReloader } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        contentReloader
    };
}
```

Modify `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts` (two places). Before:

```ts
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest: this.original.vm.canSave,
            contentReloader
        });
```

After:

```ts
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            canRequest: this.original.vm.canSave,
            contentReloader
        });
```

Before:

```ts
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest,
            contentReloader
        });
```

After:

```ts
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            canRequest,
            contentReloader
        });
```

Modify `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`. Before:

```tsx
        void session.presenter.init({
            useCases: session.useCases,
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
```

After:

```tsx
        void session.presenter.init({
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
```

**3d. The store and delete use cases clear the cache (R350).** Replace `packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.ts` with (the repository call is Task 5's; keep its field and method names if Task 5 spelled them otherwise):

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

/*
 * Stores the workflow and clears the app's cached workflow list in `ReviewRepository` (R350): the
 * review UI must see the new bindings. A store that found the workflow gone clears it as well,
 * because the workflow is gone on the server; any other failure leaves the cache.
 */
class StoreWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: WorkflowEditorRepository.Interface,
        private reviewRepository: ReviewRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        let workflow: EditorWorkflow;
        try {
            workflow = await this.repository.storeWorkflow(params);
        } catch (error) {
            if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
                this.reviewRepository.invalidateWorkflows(params.app);
            }
            throw error;
        }
        this.reviewRepository.invalidateWorkflows(params.app);
        return workflow;
    }
}

export const StoreWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository, ReviewRepository]
});
```

Replace `packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.ts` with:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

/*
 * Deletes the workflow and clears the app's cached workflow list in `ReviewRepository` (R350),
 * also when the workflow was already gone; any other failure (a blocked delete, a transport
 * failure) leaves the cache.
 */
class DeleteWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: WorkflowEditorRepository.Interface,
        private reviewRepository: ReviewRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        let workflow: EditorWorkflow;
        try {
            workflow = await this.repository.deleteWorkflow(params);
        } catch (error) {
            if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
                this.reviewRepository.invalidateWorkflows(params.app);
            }
            throw error;
        }
        this.reviewRepository.invalidateWorkflows(params.app);
        return workflow;
    }
}

export const DeleteWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository, ReviewRepository]
});
```

In `packages/app-workflows/src/editor/useCases/storeWorkflow/abstractions.ts`, replace the comment directly above `export interface IStoreWorkflowUseCase {` (Task 5's text) with:

```ts
/*
 * Stores a workflow of the app. After the store succeeds, and when the server says the workflow
 * is gone, it clears the app's cached review workflow list (R350). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
```

In `packages/app-workflows/src/editor/useCases/deleteWorkflow/abstractions.ts`, replace the comment directly above `export interface IDeleteWorkflowUseCase {` with:

```ts
/*
 * Deletes a workflow of the app. After the delete succeeds, and when the workflow was already
 * gone, it clears the app's cached review workflow list (R350). Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
 */
```

**3e. The editor presenter stops clearing the cache.** Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` (the four hunks anchor on lines Task 6 does not change).

`cancelDialog`, before:

```ts
        const pending = this.pending;
        // The deleted dialog's secondary button discards the draft (QBZ-94). The workflow is gone
        // on the server, so the review UI's cached list is stale too (R277).
        if (pending !== null && pending.action.kind === "saveAsNew") {
            const params = this.params;
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
            return;
        }
```

After:

```ts
        const pending = this.pending;
        // The deleted dialog's secondary button discards the draft (QBZ-94). The store that found
        // the workflow gone already cleared the review UI's cached list (R350).
        if (pending !== null && pending.action.kind === "saveAsNew") {
            this.applyDiscardedDraft();
            return;
        }
```

`persist`, before:

```ts
        // The server stored it, so the review UI's cached list is stale whatever the editor
        // shows now (R277, Review Focus 8).
        try {
            params.reviewUseCases.invalidateWorkflows();
            if (token === this.selectToken) {
```

After:

```ts
        // The store use case already cleared the review UI's cached list (R350).
        try {
            if (token === this.selectToken) {
```

`deleteCurrent`, before:

```ts
            params.reviewUseCases.invalidateWorkflows();
            if (token !== this.selectToken) {
                return;
            }
            this.applyDiscardedDraft();
            this.toasts.success("Workflow deleted");
```

After:

```ts
            if (token !== this.selectToken) {
                return;
            }
            this.applyDiscardedDraft();
            this.toasts.success("Workflow deleted");
```

`handleDeleteFailure`, before:

```ts
            // Already gone: the same outcome as a delete.
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
            this.toasts.success("Workflow deleted");
```

After:

```ts
            // Already gone: the same outcome as a delete; the delete use case cleared the cache (R350).
            this.applyDiscardedDraft();
            this.toasts.success("Workflow deleted");
```

(`persist`, `deleteCurrent` and `handleDeleteFailure` still read `params`: Task 6's store and delete calls pass `app: params.app.appKind`, and `showBlockedDelete` takes `params`. If lint reports `params` unused in one of them, the Task 6 call does not read it there; delete that `const params = this.params;` and its `null` check only if the method reads `params` nowhere else.)

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`. Before:

```ts
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
```

After: the line is deleted. Before (as Task 6 left it):

```ts
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}
```

After:

```ts
    app: WorkflowEditorAppAdapter;
}
```

**3f. Editor mounting passes only `app`.** Replace `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx` with:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    app: WorkflowEditorAppAdapter;
}

/*
 * The shared editor view the CMS and WB packages mount. Only the app adapter arrives as a prop and
 * goes to `presenter.init`; the editor's use cases come through DI (R353).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass a singleton: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app]);

    return (
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<StepDrawer source={presenter} stepId={presenter.vm.openStepId} />}
        />
    );
});
```

Modify `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`. Before (as Task 6 left it):

```tsx
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
```

After: the line is deleted. Before:

```tsx
    breadcrumbName: string;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}
```

After:

```tsx
    breadcrumbName: string;
    app: WorkflowEditorAppAdapter;
}
```

Before:

```tsx
        content = <WorkflowEditorView reviewUseCases={props.reviewUseCases} app={props.app} />;
```

After:

```tsx
        content = <WorkflowEditorView app={props.app} />;
```

(If Task 6 left the JSX on several lines, the after-state is the same single element with only `app`.)

Replace `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx` with:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the CMS adapter. Without the workflows
 * `editor` permission the menu item renders nothing and the route shows the no-access view (D162,
 * R331).
 */
export const CmsWorkflowEditor = () => {
    const { app } = useFeature(CmsWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.ContentModels.Workflows}
                appBreadcrumbName="cms"
                appBreadcrumbLabel="Headless CMS"
                breadcrumbName="cms.workflows"
                app={app}
            />
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={Routes.ContentModels.Workflows}
            />
        </>
    );
};
```

Replace `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx` with:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the Website Builder adapter. Without
 * the workflows `editor` permission the menu item renders nothing and the route shows the
 * no-access view (D162, R331).
 */
export const WebsiteBuilderWorkflowsMenu = () => {
    const { app } = useFeature(WbWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.Pages.Workflows}
                appBreadcrumbName="wb"
                appBreadcrumbLabel="Website Builder"
                breadcrumbName="wb.workflows"
                app={app}
            />
            <WorkflowEditorMenu
                name="websiteBuilder.pages.workflows"
                parent="wb"
                route={Routes.Pages.Workflows}
            />
        </>
    );
};
```

Replace `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";

/*
 * Resolves only the app adapter: the mounting component renders in the plugin pass, where nothing
 * may resolve a use case (R349, R354).
 */
export const CmsWorkflowEditorMountingFeature = createFeature({
    name: "CmsWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the model's folders through app-aco's gateway (R292). The Website
        // Builder registers the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

Replace `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";

/*
 * Resolves only the app adapter: the mounting component renders in the plugin pass, where nothing
 * may resolve a use case (R349, R354).
 */
export const WbWorkflowEditorMountingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the page folders through app-aco's gateway (R292). The CMS registers
        // the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

- [ ] **Step 4: Run the tests to see them pass**

Run the fourteen commands of Step 2 again, one at a time, then:

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.overlap.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

Every other `WorkflowEditorPresenter.*.test.ts` (the editor kit changed), and the review and glue tests near the changed code:

```bash
for f in cards flow init inspectionNames models options references ruleErrors stepWarnings teamSearch teams; do yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.$f.test.ts 2>&1 | tail -15; done
yarn test packages/app-workflows/src/review/presentation/targetReview/liveRefreshPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

(The `for` loop runs the files one after the other, not in parallel.) Expected: all pass; no TypeScript errors in the three packages.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): inject the review use cases into the target and request presenters and move the workflow cache clearing to the store and delete use cases" -m "TargetReviewPresenter and RequestReviewPresenter inject the use cases they call; their init parameters, the request dialog and the CMS and Website Builder editor glue stop passing review use cases (app-headless-cms-workflows, app-website-builder-workflows). StoreWorkflowUseCase and DeleteWorkflowUseCase clear their app's workflow list after success and after a not-found error, so the editor presenter, its init parameters and the editor mounting features drop the review use cases." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Dependency order of the review presenters.** R352 says the use cases "take the place of the bundle they replace"; the review presenters had no bundle dependency (it came through `init`), so the use cases go first, before the existing dependencies, as in the settings and editor presenters' final arrays.
- **`targetReviewFakes.ts`** is listed in the contract's kit list (R355) but holds no use-case wiring: it builds a fake `TargetReviewPresenter` and a view model. It does not change in this task or later. The session kits (`[CMS]/testing/createEntrySession.ts`, `[WB]/testing/createFakeSession.ts`) still return `useCases` because `IEditorReviewSession` keeps it until Task 11, which rewrites them.
- **Task 5 and Task 6 names** (checked against `../L3-editor/task-05-editor-data-layer.md` and `task-06-editor-consumers.md`): `WorkflowEditorRepository` with `storeWorkflow(params: StoreWorkflowUseCase.Params)` and `deleteWorkflow(params: DeleteWorkflowUseCase.Params)`; the routing `WorkflowEditorGateway` with the six methods taking the use case's `Params` as is; `createFakeEditorGateway()` / `FakeWorkflowEditorGateway` (`[AWET]/fakeWorkflowEditorGateway.ts`, defaults answer DTOs); the presenter's `storeWorkflowUseCase` / `deleteWorkflowUseCase` fields; `editorPresenterSetup` exposing `setup.storeWorkflow.execute`. If those files change before execution, use their names; the assertions do not change.
- **Cache timing (R350).** A store that fails with `NotFound` now clears the cache at the failure instead of when the user dismisses the "deleted" dialog; the cache state after the dialog is the same. A save-as-new after that clears it again on success. No presenter test asserted the order.

## Review fixes (sub-phase review)

- New 1j: Task 6's `[CMS|WB]/features/editorGateway/feature.test.ts` resolve `StoreWorkflowUseCase` and `DeleteWorkflowUseCase`, which depend on `ReviewRepository` after 3d; both files now register `ReviewRepositoryFeature` in their nested `beforeEach` (added to Files and to Step 4). Without it they fail with `No registration found for Workflows/ReviewRepository`.
- 1a: `StoreWorkflowUseCase.test.ts` dropped two of Task 5's behaviour assertions (the exact params object `toBe(params)` with the `savedOn` string, and the `wb` app on a new workflow); both are restored. `DeleteWorkflowUseCase.test.ts`'s blocked-delete case asserts `rejects.toBe(blocked)` again (Task 5's identity check) beside the code and data.
- 1e: the `ReviewBar.test.tsx` fakes nested calls in call arguments (`new GraphQLOperationError(...)` inside `mockRejectedValue(...)`, fakes built inside `registerInstance(...)`); the conflict and the three fakes are now named constants.
- 1f: `EditorReviewSession.test.ts` has three cases that call `createContainer` (two-app, singleton, dispose), not four.
- 1g: the "clears the review cache even when applying the saved workflow throws" case lives in `WorkflowEditorPresenter.overlap.test.ts`, not `saveFailures`; the table row and the worked example now name `overlap`, and the line count is 12 (saveFailures has 3 `invalidateWorkflows` assertions, not 4).
- Consistency item (suffixed use-case fields): already applied (`getBoundWorkflowUseCase`, `getTargetReviewUseCase`, `listStepCandidatesUseCase`, `requestReviewUseCase`).
