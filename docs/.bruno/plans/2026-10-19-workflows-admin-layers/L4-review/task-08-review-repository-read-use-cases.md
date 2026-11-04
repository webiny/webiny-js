### Task 8: `ReviewRepository` and the seven read use cases

R343, R344, R345, R348 (#16, #18-#23), R349, R350, R351, R354, R355, R360, R362; Review Focus 1, 2, 6, 10 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342; one class or one public function per file; one named import per line; no inline object types; no nested call arguments; no wrapper helpers and no private methods around a dependency call; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R237 (the old per-app bundles keep their own caches until Task 14; nothing reads them after Task 10), R243.

The review area gets its repository: it maps the routing gateway's DTOs to the domain and owns the workflow-list cache, one list per app. The seven read operations become use cases. Nothing consumes them yet (Tasks 10-12 move the presenters).

- **`ReviewListPage` moves** to `[AWR]/domain/ReviewListPage.ts` (the type unchanged). `IReviewListUseCases.ts` imports it from there; the eight other importers are repointed (`ReviewUseCases.ts`, `listReviews/abstractions.ts`, `ReviewListPresenter.ts`, `ReviewWidgetPresenter.ts` and four tests).
- **`ReviewRepository`** (`[AWR]/repository/abstractions.ts` `IReviewRepository`, token `Workflows/ReviewRepository`; `ReviewRepository.ts`, singleton, deps `[ReviewGateway]`; `ReviewRepositoryFeature` registers `ReviewGateway` and `ReviewRepository` as singletons, no `resolve`):
  - `listWorkflows(namespace)`: `app = gateway.getApp(namespace)`; reuse the map entry of that app if present, else store `gateway.listWorkflows(app).then(mapWorkflows)`; on failure delete the entry only if it still holds the failing promise, then rethrow (R350, the `ReviewUseCases.getBoundWorkflow` semantics). A namespace no app claims rejects with the gateway's plain `Error` before anything loads.
  - `invalidateWorkflows(app)` deletes that app's entry; callers already awaiting keep their result; the other app's list stays.
  - `getTargetReview`, `getReview`, `listStepCandidates`, `listReviewStepCandidates`, `getStepRun`, `listReviews`, `requestReview`, `startStep`, `takeOverStep`, `reassignStep`, `approveStep`, `rejectStep`, `cancelReview`, `restartStep`, `cancelForDelete`, `listBlockingReviews`: call the gateway with the use case's `Params` and map with the existing mappers; `null` stays `null` for `getTargetReview` and `getStepRun`; `listReviews` maps the items and defaults a `null` meta to `{ cursor: null, hasMoreItems: false }` (R351). The repository is complete in this task; Task 9 only adds the write use cases on it.
- **Read use cases** (`[AWR]/useCases/<folder>/`: `<Name>UseCase.ts`, `feature.ts`, `<Name>UseCase.test.ts` beside Task 7's `abstractions.ts`): `getBoundWorkflow` (`repository.listWorkflows(namespace)`, then `find(workflow => workflow.namespaces.includes(namespace)) ?? null`, R351), `getTargetReview`, `getReview`, `listStepCandidates`, `listReviewStepCandidates`, `getStepRun`, `listReviews` (one repository call each, no catch). Each `feature.ts` registers the use case transient and resolves `{ useCase }` (R344).
- **Registration (R354).** `ReviewServicesFeature` (`[AWR]/feature.ts`) registers `ReviewRepositoryFeature` and the seven read features beside activity, toasts and notifications; its `resolve` is unchanged. `[AW]/app.test.tsx` resolves every new token with the flag on and fails to with it off.
- **Review Focus 10 tests (R362).** The per-app routing tests in `[CMS]/index.test.tsx` and `[WB]/index.test.tsx` register `ReviewServicesFeature` instead of the bare `ReviewGateway`; the three-root test drops its direct registration, because `WorkflowsAdminApp` now registers the gateway.

**Files:**
- Create: `packages/app-workflows/src/review/domain/ReviewListPage.ts`
- Modify: `packages/app-workflows/src/review/useCases/IReviewListUseCases.ts`
- Modify (import path only): `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`, `packages/app-workflows/src/review/useCases/listReviews/abstractions.ts`, `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.ts`, `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`, `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`
- Create: `packages/app-workflows/src/review/repository/abstractions.ts`
- Create: `packages/app-workflows/src/review/repository/ReviewRepository.ts`
- Create: `packages/app-workflows/src/review/repository/feature.ts`
- Create: `packages/app-workflows/src/review/repository/ReviewRepository.test.ts`
- Create: `packages/app-workflows/src/review/testing/fakeReviewGateway.ts`
- Create: `packages/app-workflows/src/review/testing/createWorkflowDto.ts`
- Create (7 x 3): `packages/app-workflows/src/review/useCases/{getBoundWorkflow,getTargetReview,getReview,listStepCandidates,listReviewStepCandidates,getStepRun,listReviews}/{<Name>UseCase.ts,feature.ts,<Name>UseCase.test.ts}`
- Modify: `packages/app-workflows/src/review/feature.ts`
- Modify: `packages/app-workflows/src/review/feature.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`

**Interfaces:**
- Consumes: Task 7 (`ReviewGateway` / `IReviewGateway` at `[AWR]/gateway/abstractions.ts` with `getApp`, `listWorkflows(app)` and the 16 operations named as in Task 7; `ReviewListResultDto`; the 17 use-case `abstractions.ts` and their `Params`; `createFakeReviewAppGateway`); Task 5 (`WorkflowAppKind`, `~/domain/WorkflowAppKind.js`). Existing (verified): `mapWorkflow`, `mapReview`, `mapReviewWithFlags`, `mapStepCandidate`, `mapStepRunInfo`, `mapBlockingReview` (`[AWR]/gateway/map*.ts`, one parameter each); `createFeature`, `createAbstraction` (`@webiny/feature/admin`); `createDeferred` (`[AWET]/createDeferred.ts`, `{ promise, resolve, reject }`); fixtures `createReviewDto`, `createReviewWithFlagsDto`, `createViewerFlagsDto`, `createStepRunInfoDto` (`[AWRT]/reviewFixtures.ts`); `GraphQLOperationError` (`@webiny/app/errors/index.js`).
- Produces (matches the contract): `ReviewListPage` (`[AWR]/domain/ReviewListPage.ts`); `IReviewRepository`, `ReviewRepository` (`Workflows/ReviewRepository`), `ReviewRepositoryFeature` (`Workflows/ReviewRepository`); `GetBoundWorkflowUseCase` / `GetBoundWorkflowFeature`, `GetTargetReviewUseCase` / `GetTargetReviewFeature`, `GetReviewUseCase` / `GetReviewFeature`, `ListStepCandidatesUseCase` / `ListStepCandidatesFeature`, `ListReviewStepCandidatesUseCase` / `ListReviewStepCandidatesFeature`, `GetStepRunUseCase` / `GetStepRunFeature`, `ListReviewsUseCase` / `ListReviewsFeature`; `createFakeReviewGateway` / `FakeReviewGateway` (`[AWRT]/fakeReviewGateway.ts`, Tasks 9 and 10 reuse it); `createWorkflowDto` (`[AWRT]/createWorkflowDto.ts`).

**Test runner note:** admin package, `yarn test <path>` only, one command at a time. Type check: `yarn build -p @webiny/<package> --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/createWorkflowDto.ts`:

```ts
import type { WorkflowDto } from "~/review/gateway/dto.js";

// A workflow as the server lists it, bound to the given namespaces, with one manual-pick review step.
export const createWorkflowDto = (id: string, models: string[]): WorkflowDto => {
    return {
        id,
        name: `Workflow ${id}`,
        models,
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#2f80ed",
                description: null,
                type: "review",
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: true, rules: [] }
                }
            }
        ]
    };
};
```

Create `packages/app-workflows/src/review/testing/fakeReviewGateway.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewGateway } from "~/review/gateway/abstractions.js";

type ReviewGatewayOperation = Exclude<keyof ReviewGateway.Interface, "getApp">;

type ReviewGatewayMocks = { [K in ReviewGatewayOperation]: Mock };

export interface FakeReviewGateway extends ReviewGatewayMocks {
    getApp: Mock<(namespace: string) => WorkflowAppKind>;
}

const readApp = (namespace: string): WorkflowAppKind => {
    if (namespace === "wb.page") {
        return "wb";
    }
    if (namespace.startsWith("cms.")) {
        return "cms";
    }
    throw new Error(`No workflows app handles the namespace "${namespace}".`);
};

/*
 * A fake of the routing review gateway (R355) for the repository and use-case tests: `getApp`
 * answers `wb` for `wb.page` and `cms` for a `cms.*` namespace, and throws the routing gateway's
 * message for any other; every operation is a bare `vi.fn()` that the test answers.
 */
export const createFakeReviewGateway = (): FakeReviewGateway => {
    return {
        getApp: vi.fn(readApp),
        listWorkflows: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
        getStepRun: vi.fn(),
        listReviews: vi.fn(),
        requestReview: vi.fn(),
        startStep: vi.fn(),
        takeOverStep: vi.fn(),
        reassignStep: vi.fn(),
        approveStep: vi.fn(),
        rejectStep: vi.fn(),
        cancelReview: vi.fn(),
        restartStep: vi.fn(),
        cancelForDelete: vi.fn(),
        listBlockingReviews: vi.fn()
    };
};
```

Create `packages/app-workflows/src/review/repository/ReviewRepository.test.ts` (ports the cache cases of `ReviewUseCases.test.ts` "getBoundWorkflow" and "invalidateWorkflows (R277)" to one list per app, and its `listReviews` cases):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { ReviewRepository as RepositoryAbstraction } from "./abstractions.js";
import { ReviewRepository } from "./ReviewRepository.js";

const LIST_QUERY: ListReviewsParams = {
    list: "myRequests",
    where: { modelId: "article", titleContains: "launch", reviewState: "inProgress" },
    sort: "lastChangedOn_DESC",
    limit: 20,
    after: "cursor-1"
};

const serverError = new GraphQLOperationError({
    message: "The workflows could not be read.",
    code: "Workflows/Persistence",
    data: null
});

describe("ReviewRepository", () => {
    let gateway: FakeReviewGateway;
    let repository: RepositoryAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        repository = container.resolve(RepositoryAbstraction);
    });

    describe("listWorkflows (R350, Review Focus 2)", () => {
        it("asks the gateway for the namespace's app and returns that app's list, mapped", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            const workflows = await repository.listWorkflows("cms.article");

            expect(gateway.getApp).toHaveBeenCalledWith("cms.article");
            expect(gateway.listWorkflows).toHaveBeenCalledWith("cms");
            expect(workflows).toEqual([
                {
                    id: "workflow-1",
                    name: "Workflow workflow-1",
                    namespaces: ["cms.article"],
                    steps: [
                        {
                            id: "step-1",
                            title: "Editorial check",
                            color: "#2f80ed",
                            description: null,
                            type: "review",
                            allowManualPick: true,
                            assignedAutomatically: false
                        }
                    ]
                }
            ]);
        });

        it("loads an app's list once for several namespaces of that app and later calls", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.author");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("caches an empty list (A74)", async () => {
            gateway.listWorkflows.mockResolvedValue([]);

            const first = await repository.listWorkflows("cms.article");
            const second = await repository.listWorkflows("cms.article");

            expect(first).toEqual([]);
            expect(second).toEqual([]);
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("shares one request between concurrent callers", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            const first = repository.listWorkflows("cms.article");
            const second = repository.listWorkflows("cms.author");
            const [firstList, secondList] = await Promise.all([first, second]);

            expect(firstList[0].id).toBe("workflow-1");
            expect(secondList[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("keeps one list per app: the CMS and the page list load once each and never mix", async () => {
            const cmsWorkflow = createWorkflowDto("workflow-cms", ["cms.article"]);
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockImplementation(async (app: string): Promise<WorkflowDto[]> => {
                if (app === "wb") {
                    return [wbWorkflow];
                }
                return [cmsWorkflow];
            });

            const cms = await repository.listWorkflows("cms.article");
            const wb = await repository.listWorkflows("wb.page");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("wb.page");

            expect(cms.map(workflow => workflow.id)).toEqual(["workflow-cms"]);
            expect(wb.map(workflow => workflow.id)).toEqual(["workflow-wb"]);
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
            expect(gateway.listWorkflows).toHaveBeenNthCalledWith(1, "cms");
            expect(gateway.listWorkflows).toHaveBeenNthCalledWith(2, "wb");
        });

        it("does not cache a server error: the next call loads again", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockRejectedValueOnce(serverError);
            gateway.listWorkflows.mockResolvedValueOnce([workflow]);

            await expect(repository.listWorkflows("cms.article")).rejects.toBe(serverError);
            const workflows = await repository.listWorkflows("cms.article");

            expect(workflows[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does not cache a transport failure: the next call loads again", async () => {
            const transport = new Error("Network down.");
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockRejectedValueOnce(transport);
            gateway.listWorkflows.mockResolvedValueOnce([workflow]);

            await expect(repository.listWorkflows("cms.article")).rejects.toBe(transport);
            const workflows = await repository.listWorkflows("cms.article");

            expect(workflows[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("forgets only the failed app's list: the other app stays cached", async () => {
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockResolvedValueOnce([wbWorkflow]);
            gateway.listWorkflows.mockRejectedValueOnce(serverError);

            await repository.listWorkflows("wb.page");
            await expect(repository.listWorkflows("cms.article")).rejects.toBe(serverError);
            const wb = await repository.listWorkflows("wb.page");

            expect(wb[0].id).toBe("workflow-wb");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("rejects with the gateway's plain Error for a namespace no app claims and loads nothing (R361)", async () => {
            const failure = await repository.listWorkflows("blog.post").catch(error => error);

            expect(failure).toBeInstanceOf(Error);
            expect(failure.message).toBe('No workflows app handles the namespace "blog.post".');
            expect(gateway.listWorkflows).not.toHaveBeenCalled();
        });
    });

    describe("invalidateWorkflows (R350, Review Focus 2)", () => {
        it("drops the app's cached list, so the next read loads it again", async () => {
            const before = createWorkflowDto("workflow-1", ["cms.article"]);
            const after = createWorkflowDto("workflow-2", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValueOnce([before]);
            gateway.listWorkflows.mockResolvedValueOnce([after]);

            const first = await repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            const second = await repository.listWorkflows("cms.article");

            expect(first[0].id).toBe("workflow-1");
            expect(second[0].id).toBe("workflow-2");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("caches the reloaded list again", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            await repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does nothing when nothing is cached: no request, no throw, no value", () => {
            const result = repository.invalidateWorkflows("wb");

            expect(result).toBeUndefined();
            expect(gateway.listWorkflows).not.toHaveBeenCalled();
        });

        it("keeps the other app's list (Review Focus 2)", async () => {
            const cmsWorkflow = createWorkflowDto("workflow-cms", ["cms.article"]);
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockImplementation(async (app: string): Promise<WorkflowDto[]> => {
                if (app === "wb") {
                    return [wbWorkflow];
                }
                return [cmsWorkflow];
            });

            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("wb.page");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("wb.page");
            await repository.listWorkflows("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(3);
            expect(gateway.listWorkflows.mock.calls.map(call => call[0])).toEqual([
                "cms",
                "wb",
                "cms"
            ]);
        });

        it("drops a load that is still in flight: the next read starts a new request, and the late result does not come back", async () => {
            const first = createDeferred<WorkflowDto[]>();
            const newer = createWorkflowDto("workflow-new", ["cms.article"]);
            const older = createWorkflowDto("workflow-old", ["cms.article"]);
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce([newer]);

            const pending = repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            const next = await repository.listWorkflows("cms.article");

            expect(next[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);

            first.resolve([older]);
            const stale = await pending;

            // The caller that asked before the change still gets what it asked for.
            expect(stale[0].id).toBe("workflow-old");
            // The late result did not write itself back into the cache.
            const again = await repository.listWorkflows("cms.article");
            expect(again[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("keeps the newer list when a dropped load fails later", async () => {
            const first = createDeferred<WorkflowDto[]>();
            const newer = createWorkflowDto("workflow-new", ["cms.article"]);
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce([newer]);

            const pending = repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("cms.article");
            first.reject(new Error("Network down."));

            await expect(pending).rejects.toThrow("Network down.");
            const again = await repository.listWorkflows("cms.article");

            expect(again[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });
    });

    describe("listReviews (R351)", () => {
        it("passes the params untouched and returns mapped items with the meta", async () => {
            const firstDto = createReviewDto({ id: "review-1" });
            const secondDto = createReviewDto({ id: "review-2" });
            const first = createReviewWithFlagsDto({ review: firstDto });
            const second = createReviewWithFlagsDto({ review: secondDto });
            gateway.listReviews.mockResolvedValue({
                data: [first, second],
                meta: { cursor: "cursor-2", hasMoreItems: true }
            });

            const page = await repository.listReviews({ app: "cms", ...LIST_QUERY });

            expect(gateway.listReviews).toHaveBeenCalledWith({ app: "cms", ...LIST_QUERY });
            expect(page.items.map(item => item.review.id)).toEqual(["review-1", "review-2"]);
            expect(page.items[0].review.namespace).toBe("cms.article");
            expect(page.meta).toEqual({ cursor: "cursor-2", hasMoreItems: true });
        });

        it("returns an empty page that still has more items", async () => {
            gateway.listReviews.mockResolvedValue({
                data: [],
                meta: { cursor: "cursor-9", hasMoreItems: true }
            });

            const page = await repository.listReviews({ app: "wb", ...LIST_QUERY });

            expect(page.items).toEqual([]);
            expect(page.meta).toEqual({ cursor: "cursor-9", hasMoreItems: true });
        });

        it("defaults a missing meta to no more items", async () => {
            gateway.listReviews.mockResolvedValue({ data: [], meta: null });

            const page = await repository.listReviews({ app: "cms", ...LIST_QUERY });

            expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
        });
    });
});
```

Every read use-case test below uses the same wiring: the fake routing gateway as an instance, the real repository (singleton) and the use case under test (R355, the WB `DeletePageRevision.test.ts` form).

Create `packages/app-workflows/src/review/useCases/getBoundWorkflow/GetBoundWorkflowUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as RepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

describe("GetBoundWorkflowUseCase", () => {
    let gateway: FakeReviewGateway;
    let repository: RepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetBoundWorkflowUseCase);
        repository = container.resolve(RepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("returns the mapped workflow that binds the namespace (R351)", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        const author = createWorkflowDto("workflow-2", ["cms.author"]);
        gateway.listWorkflows.mockResolvedValue([article, author]);

        const workflow = await useCase.execute({ namespace: "cms.author" });

        expect(workflow).toEqual({
            id: "workflow-2",
            name: "Workflow workflow-2",
            namespaces: ["cms.author"],
            steps: [
                {
                    id: "step-1",
                    title: "Editorial check",
                    color: "#2f80ed",
                    description: null,
                    type: "review",
                    allowManualPick: true,
                    assignedAutomatically: false
                }
            ]
        });
    });

    it("finds a workflow that binds several namespaces by any of them", async () => {
        const shared = createWorkflowDto("workflow-1", ["cms.article", "cms.author"]);
        gateway.listWorkflows.mockResolvedValue([shared]);

        const workflow = await useCase.execute({ namespace: "cms.author" });

        expect(workflow?.id).toBe("workflow-1");
    });

    it("returns null when no workflow binds the namespace", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValue([article]);

        await expect(useCase.execute({ namespace: "cms.page" })).resolves.toBeNull();
    });

    it("reads the cached list of the app: several namespaces, one request", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValue([article]);

        const first = await useCase.execute({ namespace: "cms.article" });
        const second = await useCase.execute({ namespace: "cms.author" });

        expect(first?.id).toBe("workflow-1");
        expect(second).toBeNull();
        expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        expect(gateway.listWorkflows).toHaveBeenCalledWith("cms");
    });

    it("shows a namespace that lost its workflow as null after the app's list was cleared", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValueOnce([article]);
        gateway.listWorkflows.mockResolvedValueOnce([]);

        await useCase.execute({ namespace: "cms.article" });
        repository.invalidateWorkflows("cms");

        await expect(useCase.execute({ namespace: "cms.article" })).resolves.toBeNull();
    });

    it("lets a server error pass unchanged", async () => {
        const failure = new GraphQLOperationError({ message: "No access.", code: "Workflows/NotAuthorized" });
        gateway.listWorkflows.mockRejectedValue(failure);

        await expect(useCase.execute({ namespace: "wb.page" })).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/review/useCases/getTargetReview/GetTargetReviewUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

const target: ReviewTarget = { namespace: "cms.article", targetRevisionId: "entry-1#0001" };

describe("GetTargetReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetTargetReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the target and maps the review with its flags", async () => {
        const flags = createViewerFlagsDto({ canApprove: true });
        const dto = createReviewWithFlagsDto({ flags });
        gateway.getTargetReview.mockResolvedValue(dto);

        const result = await useCase.execute(target);

        expect(gateway.getTargetReview).toHaveBeenCalledWith(target);
        expect(result?.review.id).toBe("review-1");
        expect(result?.review.namespace).toBe("cms.article");
        expect(result?.flags.canApprove).toBe(true);
    });

    it("returns null when the revision has no review (a value, R346)", async () => {
        gateway.getTargetReview.mockResolvedValue(null);

        await expect(useCase.execute(target)).resolves.toBeNull();
    });

    it("lets a server error pass unchanged", async () => {
        const failure = new GraphQLOperationError({ message: "No access.", code: "Workflows/NotAuthorized" });
        gateway.getTargetReview.mockRejectedValue(failure);

        await expect(useCase.execute(target)).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/review/useCases/getReview/GetReviewUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

describe("GetReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the namespace and the id and maps the review with its flags", async () => {
        const review = createReviewDto({ id: "review-7" });
        const dto = createReviewWithFlagsDto({ review });
        gateway.getReview.mockResolvedValue(dto);

        const result = await useCase.execute({ namespace: "cms.article", reviewId: "review-7" });

        expect(gateway.getReview).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-7"
        });
        expect(result.review.id).toBe("review-7");
        expect(result.flags.canStart).toBe(true);
    });

    it("lets a server error pass unchanged", async () => {
        const failure = new GraphQLOperationError({
            message: "This review no longer exists.",
            code: "Workflows/Review/NotFound"
        });
        gateway.getReview.mockRejectedValue(failure);

        await expect(
            useCase.execute({ namespace: "cms.article", reviewId: "review-7" })
        ).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/review/useCases/listStepCandidates/ListStepCandidatesUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

const params: UseCaseAbstraction.Params = {
    workflowId: "workflow-1",
    stepId: "step-1",
    target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" }
};

describe("ListStepCandidatesUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListStepCandidatesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params and maps the candidates", async () => {
        gateway.listStepCandidates.mockResolvedValue([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
            { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
        ]);

        const result = await useCase.execute(params);

        expect(gateway.listStepCandidates).toHaveBeenCalledWith(params);
        expect(result).toEqual([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
            { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
        ]);
    });

    it("lets a transport failure pass unchanged", async () => {
        const transport = new Error("Network down.");
        gateway.listStepCandidates.mockRejectedValue(transport);

        await expect(useCase.execute(params)).rejects.toBe(transport);
    });
});
```

Create `packages/app-workflows/src/review/useCases/listReviewStepCandidates/ListReviewStepCandidatesUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewStepCandidatesUseCase } from "./ListReviewStepCandidatesUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "wb.page",
    reviewId: "review-1",
    stepId: "step-1"
};

describe("ListReviewStepCandidatesUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListReviewStepCandidatesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params with the namespace and maps the candidates", async () => {
        gateway.listReviewStepCandidates.mockResolvedValue([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }
        ]);

        const result = await useCase.execute(params);

        expect(gateway.listReviewStepCandidates).toHaveBeenCalledWith(params);
        expect(result).toEqual([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }
        ]);
    });
});
```

Create `packages/app-workflows/src/review/useCases/getStepRun/GetStepRunUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetStepRunUseCase } from "./GetStepRunUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    taskId: "task-1"
};

describe("GetStepRunUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetStepRunUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the ids and maps the info of the task", async () => {
        const dto = createStepRunInfoDto({ taskId: "task-1", status: "done", iterations: 2 });
        gateway.getStepRun.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.getStepRun).toHaveBeenCalledWith(params);
        expect(result).toMatchObject({ taskId: "task-1", status: "done", iterations: 2 });
    });

    it("returns null when the task is gone (R257)", async () => {
        gateway.getStepRun.mockResolvedValue(null);

        await expect(useCase.execute(params)).resolves.toBeNull();
    });

    it("keeps the code and the data of a server error", async () => {
        const failure = new GraphQLOperationError({
            message: "The step run was not found.",
            code: "Workflows/Review/StepRunNotFound",
            data: { reviewId: "review-1", stepId: "step-1", taskId: "task-1" }
        });
        gateway.getStepRun.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/review/useCases/listReviews/ListReviewsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

const params: UseCaseAbstraction.Params = {
    app: "wb",
    list: "assignedToMe",
    where: {},
    sort: "lastChangedOn_ASC",
    limit: 5,
    after: null
};

describe("ListReviewsUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListReviewsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params with the app and returns the mapped page", async () => {
        const review = createReviewDto({ id: "review-3", model: "wb.page" });
        const item = createReviewWithFlagsDto({ review });
        gateway.listReviews.mockResolvedValue({
            data: [item],
            meta: { cursor: "cursor-1", hasMoreItems: true }
        });

        const page = await useCase.execute(params);

        expect(gateway.listReviews).toHaveBeenCalledWith(params);
        expect(page.items.map(entry => entry.review.id)).toEqual(["review-3"]);
        expect(page.items[0].review.namespace).toBe("wb.page");
        expect(page.meta).toEqual({ cursor: "cursor-1", hasMoreItems: true });
    });

    it("reads a missing meta as no more items (R351)", async () => {
        gateway.listReviews.mockResolvedValue({ data: [], meta: null });

        const page = await useCase.execute(params);

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
    });
});
```

Modify `packages/app-workflows/src/review/feature.test.ts`.

Imports, before:

```ts
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
```

After:

```ts
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
```

Add a case after "registers the three services". Before:

```ts
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
```

After:

```ts
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers the review data layer: gateway and repository singletons, the read use cases transient (R354)", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(ReviewGateway)).toBe(container.resolve(ReviewGateway));
        expect(container.resolve(ReviewRepository)).toBe(container.resolve(ReviewRepository));
        expect(container.resolve(GetBoundWorkflowUseCase)).not.toBe(
            container.resolve(GetBoundWorkflowUseCase)
        );
        expect(container.resolve(GetTargetReviewUseCase)).toBeDefined();
        expect(container.resolve(GetReviewUseCase)).toBeDefined();
        expect(container.resolve(ListStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(ListReviewStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
```

Modify `packages/app-workflows/src/app.test.tsx` (the flag-on and flag-off root assertions, R354).

Imports, before:

```ts
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
```

After:

```ts
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
```

Add a describe block directly after `describe("WorkflowsAdminApp review services", ...)`. Before (the end of that block):

```tsx
        expect(() => container.resolve(ReviewNotificationService)).toThrow();
    });
});
```

After:

```tsx
        expect(() => container.resolve(ReviewNotificationService)).toThrow();
    });
});

describe("WorkflowsAdminApp review data layer", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the review gateway and repository as singletons and the use cases when the flag is on (R354)", () => {
        const container = mount(true);

        expect(container.resolve(ReviewGateway)).toBe(container.resolve(ReviewGateway));
        expect(container.resolve(ReviewRepository)).toBe(container.resolve(ReviewRepository));
        expect(container.resolve(GetBoundWorkflowUseCase)).toBeDefined();
        expect(container.resolve(GetTargetReviewUseCase)).toBeDefined();
        expect(container.resolve(GetReviewUseCase)).toBeDefined();
        expect(container.resolve(ListStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(ListReviewStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });

    it("registers none of it when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ReviewGateway)).toThrow();
        expect(() => container.resolve(ReviewRepository)).toThrow();
        expect(() => container.resolve(GetBoundWorkflowUseCase)).toThrow();
        expect(() => container.resolve(GetTargetReviewUseCase)).toThrow();
        expect(() => container.resolve(GetReviewUseCase)).toThrow();
        expect(() => container.resolve(ListStepCandidatesUseCase)).toThrow();
        expect(() => container.resolve(ListReviewStepCandidatesUseCase)).toThrow();
        expect(() => container.resolve(GetStepRunUseCase)).toThrow();
        expect(() => container.resolve(ListReviewsUseCase)).toThrow();
    });
});
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (R362: the routing test registers the data features as `WorkflowsAdminApp` does).

Before:

```ts
import { ReviewGateway } from "@webiny/app-workflows/review/gateway/ReviewGateway.js";
```

After:

```ts
import { ReviewServicesFeature } from "@webiny/app-workflows/review/feature.js";
```

Before:

```tsx
        // The data features of app-workflows; Task 8 registers ReviewServicesFeature instead.
        container.register(ReviewGateway).inSingletonScope();
```

After:

```tsx
        // The review data features of app-workflows, as WorkflowsAdminApp registers them.
        ReviewServicesFeature.register(container);
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx` the same way.

Before:

```ts
import { ReviewGateway } from "@webiny/app-workflows/review/gateway/ReviewGateway.js";
```

After:

```ts
import { ReviewServicesFeature } from "@webiny/app-workflows/review/feature.js";
```

Before (the per-app routing test):

```tsx
        // The data features of app-workflows; Task 8 registers ReviewServicesFeature instead.
        container.register(ReviewGateway).inSingletonScope();
```

After:

```tsx
        // The review data features of app-workflows, as WorkflowsAdminApp registers them.
        ReviewServicesFeature.register(container);
```

Before (the review three-root test):

```tsx
        const container = createContainer(true);
        // Task 8 drops this line: WorkflowsAdminApp registers ReviewGateway through ReviewServicesFeature.
        container.register(ReviewGateway).inSingletonScope();

        render(
```

After:

```tsx
        const container = createContainer(true);

        render(
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/repository/ReviewRepository.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/getBoundWorkflow/GetBoundWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/getTargetReview/GetTargetReviewUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/getReview/GetReviewUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/listStepCandidates/ListStepCandidatesUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/listReviewStepCandidates/ListReviewStepCandidatesUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/getStepRun/GetStepRunUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/listReviews/ListReviewsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: the repository and the seven use-case tests fail with `Failed to resolve import` (`./abstractions.js` of `repository/`, `./<Name>UseCase.js`); `feature.test.ts` and `app.test.tsx` fail the new cases with `No registration found for Workflows/ReviewGateway`; the CMS and WB routing tests fail with `No registration found for Workflows/ReviewGateway` (the feature does not register it yet); the three-root test fails the same way. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/domain/ReviewListPage.ts`:

```ts
import type { ReviewListMeta } from "./types.js";
import type { ReviewWithFlags } from "./types.js";

// One page of a review list: the mapped reviews and where the next page starts.
export interface ReviewListPage {
    items: ReviewWithFlags[];
    meta: ReviewListMeta;
}
```

Modify `packages/app-workflows/src/review/useCases/IReviewListUseCases.ts` (whole file after):

```ts
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";

export interface IReviewListUseCases {
    listReviews(params: ListReviewsParams): Promise<ReviewListPage>;
}
```

Repoint the other importers:

```bash
grep -rl 'import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";' packages/app-workflows/src | xargs sed -i '' 's#import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";#import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";#'
sed -i '' 's#import type { ReviewListPage } from "./IReviewListUseCases.js";#import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";#' packages/app-workflows/src/review/useCases/ReviewUseCases.ts
grep -rn "ReviewListPage } from" packages/app-workflows/src
```

Expected: every hit of the last command imports `~/review/domain/ReviewListPage.js` (9 files: `ReviewUseCases.ts`, `listReviews/abstractions.ts`, `ReviewListPresenter.ts`, `ReviewWidgetPresenter.ts`, `IReviewListUseCases.ts` and the four tests).

Create `packages/app-workflows/src/review/repository/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import type { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import type { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import type { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import type { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import type { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import type { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import type { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import type { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import type { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import type { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import type { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import type { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import type { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";

/*
 * The review data of every app (R343, R350): domain values over `ReviewGateway`, and the workflow
 * list cached per app. It never swallows an error.
 */
export interface IReviewRepository {
    // The workflow list of the namespace's app, read once and cached until it is invalidated.
    listWorkflows(namespace: string): Promise<ReviewWorkflow[]>;
    // Drops the app's cached list, also a load in flight; callers already awaiting keep their result.
    invalidateWorkflows(app: WorkflowAppKind): void;
    getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlags | null>;
    getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlags>;
    listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidate[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidate[]>;
    getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfo | null>;
    listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListPage>;
    requestReview(params: RequestReviewUseCase.Params): Promise<Review>;
    startStep(params: StartReviewStepUseCase.Params): Promise<Review>;
    takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<Review>;
    reassignStep(params: ReassignReviewStepUseCase.Params): Promise<Review>;
    approveStep(params: ApproveReviewStepUseCase.Params): Promise<Review>;
    rejectStep(params: RejectReviewStepUseCase.Params): Promise<Review>;
    cancelReview(params: CancelReviewUseCase.Params): Promise<Review>;
    restartStep(params: RestartReviewStepUseCase.Params): Promise<Review>;
    cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<Review[]>;
    listBlockingReviews(params: ListBlockingReviewsUseCase.Params): Promise<BlockingReview[]>;
}

export const ReviewRepository = createAbstraction<IReviewRepository>("Workflows/ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
}
```

Create `packages/app-workflows/src/review/repository/ReviewRepository.ts`:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { mapBlockingReview } from "~/review/gateway/mapBlockingReview.js";
import { mapReview } from "~/review/gateway/mapReview.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";
import { mapStepCandidate } from "~/review/gateway/mapStepCandidate.js";
import { mapStepRunInfo } from "~/review/gateway/mapStepRunInfo.js";
import { mapWorkflow } from "~/review/gateway/mapWorkflow.js";
import type { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import type { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import type { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import type { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import type { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import type { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import type { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import type { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import type { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import type { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import type { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import type { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import type { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import { ReviewRepository as RepositoryAbstraction } from "./abstractions.js";

const mapWorkflows = (dtos: WorkflowDto[]): ReviewWorkflow[] => {
    return dtos.map(mapWorkflow);
};

/*
 * Maps the routing gateway's DTOs to the domain and caches the workflow list per app (R350). The
 * cache holds the load's promise, so concurrent and later reads of one app share one request. A
 * failed load is forgotten only while it is still the cached one, so a load dropped by
 * `invalidateWorkflows` that settles later never touches the newer one.
 */
class ReviewRepositoryImpl implements RepositoryAbstraction.Interface {
    private workflows = new Map<WorkflowAppKind, Promise<ReviewWorkflow[]>>();

    constructor(private gateway: ReviewGateway.Interface) {}

    async listWorkflows(namespace: string): Promise<ReviewWorkflow[]> {
        const app = this.gateway.getApp(namespace);
        let loading = this.workflows.get(app);
        if (!loading) {
            loading = this.gateway.listWorkflows(app).then(mapWorkflows);
            this.workflows.set(app, loading);
        }

        try {
            return await loading;
        } catch (error) {
            if (this.workflows.get(app) === loading) {
                this.workflows.delete(app);
            }
            throw error;
        }
    }

    invalidateWorkflows(app: WorkflowAppKind): void {
        this.workflows.delete(app);
    }

    async getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlags | null> {
        const dto = await this.gateway.getTargetReview(params);
        if (!dto) {
            return null;
        }
        return mapReviewWithFlags(dto);
    }

    async getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlags> {
        const dto = await this.gateway.getReview(params);
        return mapReviewWithFlags(dto);
    }

    async listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listReviewStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfo | null> {
        const dto = await this.gateway.getStepRun(params);
        if (!dto) {
            return null;
        }
        return mapStepRunInfo(dto);
    }

    async listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListPage> {
        const result = await this.gateway.listReviews(params);
        const items = result.data.map(mapReviewWithFlags);
        return { items, meta: result.meta ?? { cursor: null, hasMoreItems: false } };
    }

    async requestReview(params: RequestReviewUseCase.Params): Promise<Review> {
        const dto = await this.gateway.requestReview(params);
        return mapReview(dto);
    }

    async startStep(params: StartReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.startStep(params);
        return mapReview(dto);
    }

    async takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.takeOverStep(params);
        return mapReview(dto);
    }

    async reassignStep(params: ReassignReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.reassignStep(params);
        return mapReview(dto);
    }

    async approveStep(params: ApproveReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.approveStep(params);
        return mapReview(dto);
    }

    async rejectStep(params: RejectReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.rejectStep(params);
        return mapReview(dto);
    }

    async cancelReview(params: CancelReviewUseCase.Params): Promise<Review> {
        const dto = await this.gateway.cancelReview(params);
        return mapReview(dto);
    }

    async restartStep(params: RestartReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.restartStep(params);
        return mapReview(dto);
    }

    async cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<Review[]> {
        const dtos = await this.gateway.cancelForDelete(params);
        return dtos.map(mapReview);
    }

    async listBlockingReviews(
        params: ListBlockingReviewsUseCase.Params
    ): Promise<BlockingReview[]> {
        const dtos = await this.gateway.listBlockingReviews(params);
        return dtos.map(mapBlockingReview);
    }
}

export const ReviewRepository = RepositoryAbstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [ReviewGateway]
});
```

Create `packages/app-workflows/src/review/repository/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewGateway } from "~/review/gateway/ReviewGateway.js";
import { ReviewRepository } from "./ReviewRepository.js";

/*
 * The review area's routing gateway and repository, both singletons (R343, R354): one workflow
 * cache per admin. Registered by `ReviewServicesFeature`; no `resolve` (the Dashboard form).
 */
export const ReviewRepositoryFeature = createFeature({
    name: "Workflows/ReviewRepository",
    register(container) {
        container.register(ReviewGateway).inSingletonScope();
        container.register(ReviewRepository).inSingletonScope();
    }
});
```

Create the seven use cases and their features.

`packages/app-workflows/src/review/useCases/getBoundWorkflow/GetBoundWorkflowUseCase.ts`:

```ts
import type { ReviewWorkflow } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetBoundWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWorkflow | null> {
        const workflows = await this.repository.listWorkflows(params.namespace);
        // The workflow that binds the namespace (R351).
        const workflow = workflows.find(item => item.namespaces.includes(params.namespace));
        return workflow ?? null;
    }
}

export const GetBoundWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetBoundWorkflowUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/getBoundWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

export const GetBoundWorkflowFeature = createFeature({
    name: "Workflows/GetBoundWorkflow",
    register(container) {
        container.register(GetBoundWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/getTargetReview/GetTargetReviewUseCase.ts`:

```ts
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWithFlags | null> {
        return this.repository.getTargetReview(params);
    }
}

export const GetTargetReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/getTargetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

export const GetTargetReviewFeature = createFeature({
    name: "Workflows/GetTargetReview",
    register(container) {
        container.register(GetTargetReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/getReview/GetReviewUseCase.ts`:

```ts
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWithFlags> {
        return this.repository.getReview(params);
    }
}

export const GetReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/getReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

export const GetReviewFeature = createFeature({
    name: "Workflows/GetReview",
    register(container) {
        container.register(GetReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/listStepCandidates/ListStepCandidatesUseCase.ts`:

```ts
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListStepCandidatesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<StepCandidate[]> {
        return this.repository.listStepCandidates(params);
    }
}

export const ListStepCandidatesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListStepCandidatesUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/listStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

export const ListStepCandidatesFeature = createFeature({
    name: "Workflows/ListStepCandidates",
    register(container) {
        container.register(ListStepCandidatesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/listReviewStepCandidates/ListReviewStepCandidatesUseCase.ts`:

```ts
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListReviewStepCandidatesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<StepCandidate[]> {
        return this.repository.listReviewStepCandidates(params);
    }
}

export const ListReviewStepCandidatesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListReviewStepCandidatesUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/listReviewStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewStepCandidatesUseCase } from "./ListReviewStepCandidatesUseCase.js";

export const ListReviewStepCandidatesFeature = createFeature({
    name: "Workflows/ListReviewStepCandidates",
    register(container) {
        container.register(ListReviewStepCandidatesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/getStepRun/GetStepRunUseCase.ts`:

```ts
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetStepRunUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewStepRunInfo | null> {
        return this.repository.getStepRun(params);
    }
}

export const GetStepRunUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetStepRunUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/getStepRun/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetStepRunUseCase } from "./GetStepRunUseCase.js";

export const GetStepRunFeature = createFeature({
    name: "Workflows/GetStepRun",
    register(container) {
        container.register(GetStepRunUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/listReviews/ListReviewsUseCase.ts`:

```ts
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListReviewsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewListPage> {
        return this.repository.listReviews(params);
    }
}

export const ListReviewsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/listReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

export const ListReviewsFeature = createFeature({
    name: "Workflows/ListReviews",
    register(container) {
        container.register(ListReviewsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/review/feature.ts`.

Before:

```ts
import { ReviewNotificationService } from "./notifications/ReviewNotificationService.js";

/*
 * The app-neutral review services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211). All three are singletons (R212).
 */
export const ReviewServicesFeature = createFeature({
    name: "Workflows/ReviewServices",
    register(container) {
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewToasts).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
    },
```

After:

```ts
import { ReviewNotificationService } from "./notifications/ReviewNotificationService.js";
import { ReviewRepositoryFeature } from "./repository/feature.js";
import { GetBoundWorkflowFeature } from "./useCases/getBoundWorkflow/feature.js";
import { GetReviewFeature } from "./useCases/getReview/feature.js";
import { GetStepRunFeature } from "./useCases/getStepRun/feature.js";
import { GetTargetReviewFeature } from "./useCases/getTargetReview/feature.js";
import { ListReviewStepCandidatesFeature } from "./useCases/listReviewStepCandidates/feature.js";
import { ListReviewsFeature } from "./useCases/listReviews/feature.js";
import { ListStepCandidatesFeature } from "./useCases/listStepCandidates/feature.js";

/*
 * The app-neutral review services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): activity, toasts and notifications (singletons, R212), and the review data layer,
 * the routing gateway and the repository (singletons) and one transient use case per operation
 * (R354).
 */
export const ReviewServicesFeature = createFeature({
    name: "Workflows/ReviewServices",
    register(container) {
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewToasts).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
        ReviewRepositoryFeature.register(container);
        GetBoundWorkflowFeature.register(container);
        GetTargetReviewFeature.register(container);
        GetReviewFeature.register(container);
        ListStepCandidatesFeature.register(container);
        ListReviewStepCandidatesFeature.register(container);
        GetStepRunFeature.register(container);
        ListReviewsFeature.register(container);
    },
```

Repoint the Task 7 import of `listReviews/abstractions.ts` (done by the `sed` above; check):

```bash
grep -n "ReviewListPage" packages/app-workflows/src/review/useCases/listReviews/abstractions.ts
```

Expected: `import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";`.

- [ ] **Step 4: Run the tests to see them pass**

Run the twelve commands of Step 2 again, one at a time.

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/gateway/ReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
git commit -m "refactor(app-workflows): add ReviewRepository with the per-app workflow cache and the review read use cases" -m "ReviewRepository maps the routing gateway's DTOs and caches the workflow list per app with the old dedupe, retry and invalidation rules. Seven read use cases (bound workflow, target review, review, step candidates, review step candidates, step run, review list) run on it and are registered by ReviewServicesFeature. The CMS and Website Builder routing tests register the review services (app-headless-cms-workflows, app-website-builder-workflows)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Repository method names** follow Task 7's routing gateway (the old bundle names), plus `listWorkflows(namespace)` and `invalidateWorkflows(app)` as the contract spells them.
- **`createFakeReviewGateway`** (`[AWRT]/fakeReviewGateway.ts`) is a fake of the routing gateway (the "fake area gateway instance" of R355), shared by the repository test and the 17 use-case tests of Tasks 8 and 9 and by Task 10's store and delete tests; it is not an aggregate use-case fake.
- **`createWorkflowDto`** gets its own file in `[AWRT]` (the `createWorkflow.ts` precedent, R243) because the repository test, `GetBoundWorkflowUseCase.test.ts` and Task 10's tests all need it; it was a local helper of `ReviewUseCases.test.ts`.
- **Ported cases.** `ReviewUseCases.test.ts` stays until Task 14. Its "getBoundWorkflow" and "invalidateWorkflows (R277)" cases are ported to `ReviewRepository.test.ts` (per app instead of per instance; "does not share a cache between two instances" and "does not touch the cache of another instance" become "keeps one list per app" and "invalidating one app keeps the other's list") and to `GetBoundWorkflowUseCase.test.ts` (the namespace filter and the null cases); its "reads" and "listReviews" cases to the read use-case tests and the repository's `listReviews` cases; its "error mapping (R204)" cases live in Task 7's `ReviewGateway.test.ts`. Its "per-app subclasses" cases have no successor: R347 removes per-app use cases (G15).

## Review fixes (sub-phase review)

- None needed. Checked: `ReviewRepository` keeps the `ReviewUseCases.getBoundWorkflow` cache semantics (promise cached per app, failure forgotten only while it is the cached one), the mapper outputs asserted by the tests (`mapWorkflow`, `mapReview` namespace from `model`, fixture defaults), the nine `ReviewListPage` importers the `sed` repoints, the `feature.test.ts` and `app.test.tsx` anchors, and the index-test hunks against Task 7's after-state.
