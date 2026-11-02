### Task 7: Review app gateways and the routing `ReviewGateway`

R343, R344, R345, R346, R347, R348 (#16, #18-#33), R349, R355, R356, R360, R361, R362; A113, A114, A115; Review Focus 1, 3, 6, 7, 10 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342 no behaviour change; one class or one public function per file; one named import per line; no inline object types; no nested call arguments; namespace types outside the declaring file; comments end with a period; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R202, R204 (app gateways resolve with the envelope and reject only on transport), R237 (still binding for the bridges below), R238, R243 (fakes in `src/review/testing/`).

The review data layer gets the shape of the editor one (Task 5): every app registers its review gateway under one shared multi-registration token, and an app-neutral routing gateway in `app-workflows` picks it per call and unwraps the envelope once. Nothing consumes the routing gateway yet (Task 8 builds `ReviewRepository` on it); the old per-app bundles keep running on their per-app tokens until Task 14.

- **The app contract moves (R345).** `[AWR]/gateway/IReviewGateway.ts` moves to `[AWR]/appGateway/IReviewAppGateway.ts` (`git mv`, so history follows). The interface is renamed `IReviewAppGateway` and gains `readonly app: WorkflowAppKind` and `canHandle(namespace: string): boolean`. Its 17 envelope methods and the wire parameter types stay as they are (`ListStepCandidatesParams`, `ReviewStepRef`, `RequestReviewPick`, ... are still declared there). Every importer is repointed (a `sed` over the three packages, then the four files that name the interface).
- **`ReviewAppGateway`** (`[AWR]/appGateway/abstractions.ts`, token `Workflows/ReviewAppGateway`, namespace `ReviewAppGateway.Interface`).
- **CMS and WB app gateways (R347).** `CmsReviewGateway` gets `readonly app = "cms"` and `canHandle = isCmsAppName(namespace)`; `WbReviewGateway` gets `readonly app = "wb"` and `canHandle = namespace === WB_PAGE_APP`. Their per-app tokens (`CmsReviewGateway`, `WbReviewGateway` in `XReviewGateway/abstractions.ts`) stay, retyped to `IReviewAppGateway`; their documents, variables, namespace checks and the WB `listBlockingReviews` stub do not change.
- **Bridges (R356).** `CmsReviewAppGateway` (`[CMS]/features/gateway/CmsReviewAppGateway/CmsReviewAppGateway.ts`: `class CmsReviewAppGatewayImpl extends CmsReviewGateway {}` bound to `ReviewAppGateway`, deps `[MainGraphQLClient]`) and the WB mirror `WbReviewAppGateway`, registered as singletons by `CmsReviewFeature` / `WbReviewFeature` beside the old registrations. `createImplementation` on a subclass writes the metadata on the subclass only (`Reflect.defineMetadata` on the target), so the per-app token binding of the parent class is untouched (R237). Task 14 folds each app back to one class.
- **Per-operation contracts.** This task writes the complete `abstractions.ts` of all 17 review use cases (#16, #18-#33: interface with its R360 throw comment, `<Name>UseCaseParams` where the input adds a routing key, token `Workflows/<Name>UseCase`, namespace with `Interface` and `Params`). Tasks 8 and 9 add the implementation, the feature and the test beside each.
- **Routing gateway** (`[AWR]/gateway/abstractions.ts` `IReviewGateway`, token `Workflows/ReviewGateway`; `[AWR]/gateway/ReviewGateway.ts`, dependencies `[[ReviewAppGateway, { multiple: true }]]`):
  - `getApp(namespace)` answers the claiming app gateway's `app`; `listWorkflows(app)` and `listReviews({ app, ... })` route by `app`; the 15 review-bound operations route by `canHandle(namespace)`; the first registered claimant wins (A114, A115).
  - Nobody claims: `new Error(\`No workflows app handles the namespace "${namespace}".\`)` resp. `` new Error(`No workflows app is registered for "${app}".`) `` (R347, R361), before any app gateway is called.
  - The app gateway receives exactly its old parameter object, built field by field without the routing field (`getReview(params.reviewId)`, `startStep({ reviewId, stepId })`); where the use-case `Params` is the wire type itself (`getTargetReview`, `listStepCandidates`, `requestReview`, `cancelForDelete`, `listBlockingReviews`) it is passed as is.
  - Envelopes (R346): `if (envelope.error || !envelope.data) { throw toOperationError(envelope.error); }`, except `getTargetReview` and `getStepRun` (`if (envelope.error) { throw ... }`, then `envelope.data`, which may be `null`). `listReviews` returns `ReviewListResultDto { data, meta }` with `meta` as the server sent it (`null` stays `null`; the repository defaults it, Task 8). The routing gateway never catches: a transport rejection and a plain `Error` of an app gateway (its namespace check) reach the caller unchanged.
  - The class comment states the R349 registration rule.
- **Registration.** No `[AW]` feature registers `ReviewGateway` in this task (Task 8's `ReviewRepositoryFeature` does). The Review Focus 10 tests register it directly on their test container.

**Files:**
- Move: `packages/app-workflows/src/review/gateway/IReviewGateway.ts` -> `packages/app-workflows/src/review/appGateway/IReviewAppGateway.ts` (then modify)
- Create: `packages/app-workflows/src/review/appGateway/abstractions.ts`
- Create: `packages/app-workflows/src/review/gateway/abstractions.ts`
- Create: `packages/app-workflows/src/review/gateway/ReviewGateway.ts`
- Modify: `packages/app-workflows/src/review/gateway/dto.ts` (`ReviewListResultDto`)
- Create (17): `packages/app-workflows/src/review/useCases/{getBoundWorkflow,getTargetReview,getReview,listStepCandidates,listReviewStepCandidates,getStepRun,listReviews,requestReview,startReviewStep,takeOverReviewStep,reassignReviewStep,approveReviewStep,rejectReviewStep,cancelReview,restartReviewStep,cancelReviewsForDelete,listBlockingReviews}/abstractions.ts`
- Create: `packages/app-workflows/src/review/testing/fakeReviewAppGateway.ts`
- Create: `packages/app-workflows/src/review/gateway/ReviewGateway.test.ts`
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.ts` (constructor type)
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts` (fake gateway type)
- Modify (import path only): `packages/app-workflows/src/review/useCases/{IReviewActionUseCases,IReviewCancelForDeleteUseCases,IReviewListUseCases,IReviewReadUseCases}.ts`, `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.ts`, `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`, `packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/abstractions.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewAppGateway/CmsReviewAppGateway.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify (import path only): `packages/app-headless-cms-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeleteEntryRevisionUseCaseReviewDecorator,DeleteEntryUseCaseReviewDecorator,PermanentlyDeleteEntryUseCaseReviewDecorator}.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/abstractions.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewAppGateway/WbReviewAppGateway.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`
- Modify (import path only): `packages/app-website-builder-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeletePageRevisionUseCaseReviewDecorator,DeletePageUseCaseReviewDecorator}.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source unless marked): `toOperationError(error: EditorErrorDto | null): GraphQLOperationError` at `~/gateway/toOperationError.js` (Task 1; `ReviewErrorDto` is structurally `EditorErrorDto`); `WorkflowAppKind` at `~/domain/WorkflowAppKind.js` (`"cms" | "wb"`, Task 5); `createAbstraction`, `createFeature` (`@webiny/feature/admin`); `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`); `GraphQLOperationError` (`@webiny/app/errors/index.js`); multi-injection `[[Token, { multiple: true }]]` (`packages/app-admin/src/features/tools/ToolRegistry.ts:34-37`); `Container.registerFactory`, `Container.resolveAll` (`node_modules/@webiny/di/dist/Container.d.ts`; `resolveMultiple` returns instance registrations, then class registrations, then factories, `index.js:216-236`); `isCmsAppName` (`[CMS]/utils/appName.ts`); `WB_PAGE_APP` (`[WB]/constants.ts`); the DTOs of `[AWR]/gateway/dto.ts` (`WorkflowDto`, `ReviewWithFlagsDto`, `StepCandidateDto`, `ReviewStepRunInfoDto`, `ReviewDto`, `BlockingReviewDto`, `ReviewEnvelope`, `ReviewListEnvelope`, `ReviewErrorDto`); domain `ReviewTarget`, `ReviewWorkflow`, `ReviewWithFlags`, `StepCandidate`, `ReviewStepRunInfo`, `Review`, `BlockingReview`, `ReviewListMeta` (`[AWR]/domain/types.ts`); `ReviewListPage` (`[AWR]/useCases/IReviewListUseCases.ts`, moved by Task 8); fixtures `createReviewDto`, `createReviewWithFlagsDto`, `createStepRunInfoDto`, `createBlockingReviewDto` (`[AWR]/testing/reviewFixtures.ts`).
- Produces (matches the contract): `IReviewAppGateway` and `ReviewAppGateway` (`Workflows/ReviewAppGateway`); `IReviewGateway` and `ReviewGateway` (`Workflows/ReviewGateway`) with `getApp(namespace: string): WorkflowAppKind`, `listWorkflows(app: WorkflowAppKind): Promise<WorkflowDto[]>` and the 16 operations below; `ReviewListResultDto`; the 17 use-case abstractions and their `Params` types (consumed by Tasks 8-13); `CmsReviewAppGateway`, `WbReviewAppGateway` (removed by Task 14); `createFakeReviewAppGateway`, `FakeReviewAppGateway`, `ReviewAppGatewayOperation` (`[AWRT]/fakeReviewAppGateway.ts`, used by Task 8's index tests and Task 14).

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. Type check: `yarn build -p @webiny/<package> --no-cache` (8a R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/fakeReviewAppGateway.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewAppGateway } from "~/review/appGateway/abstractions.js";

// The envelope operations of an app gateway, without `app` and `canHandle`.
export type ReviewAppGatewayOperation = Exclude<keyof ReviewAppGateway.Interface, "app" | "canHandle">;

type ReviewAppGatewayMocks = { [K in ReviewAppGatewayOperation]: Mock };

export interface FakeReviewAppGateway extends ReviewAppGatewayMocks {
    readonly app: WorkflowAppKind;
    canHandle: Mock<(namespace: string) => boolean>;
}

/*
 * A fake app gateway for the routing tests (R355): it serves `app`, claims exactly the given
 * namespaces, and every envelope operation is a bare `vi.fn()` the test answers with
 * `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeReviewAppGateway = (
    app: WorkflowAppKind,
    claimedNamespaces: string[]
): FakeReviewAppGateway => {
    return {
        app,
        canHandle: vi.fn((namespace: string) => claimedNamespaces.includes(namespace)),
        listWorkflows: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
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
        getStepRun: vi.fn(),
        listBlockingReviews: vi.fn()
    };
};
```

Create `packages/app-workflows/src/review/gateway/ReviewGateway.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewAppGateway } from "~/review/appGateway/abstractions.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewErrorDto } from "~/review/gateway/dto.js";
import type { StepCandidateDto } from "~/review/gateway/dto.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { createFakeReviewAppGateway } from "~/review/testing/fakeReviewAppGateway.js";
import type { FakeReviewAppGateway } from "~/review/testing/fakeReviewAppGateway.js";
import type { ReviewAppGatewayOperation } from "~/review/testing/fakeReviewAppGateway.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
import { ReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { ReviewGateway } from "./ReviewGateway.js";

const CMS_NAMESPACE = "cms.article";
const WB_NAMESPACE = "wb.page";
const REVISION_ID = "entry-1#0001";

const WORKFLOW: WorkflowDto = {
    id: "workflow-1",
    name: "Article review",
    models: [CMS_NAMESPACE],
    steps: []
};

const CANDIDATE: StepCandidateDto = {
    id: "user-1",
    displayName: "Ada",
    excluded: false,
    excludedReason: null
};

const ERROR: ReviewErrorDto = {
    code: "Workflows/Review/StepNotCurrent",
    message: "The step is not the current step.",
    data: { reviewId: "review-1", stepId: "step-1" }
};

const LIST_QUERY: ListReviewsParams = {
    list: "myRequests",
    where: { titleContains: "launch" },
    sort: "lastChangedOn_DESC",
    limit: 20,
    after: "cursor-1"
};

const createGateway = (appGateways: FakeReviewAppGateway[]): GatewayAbstraction.Interface => {
    const container = new Container();
    for (const appGateway of appGateways) {
        container.registerInstance(ReviewAppGateway, appGateway);
    }
    container.register(ReviewGateway).inSingletonScope();
    return container.resolve(GatewayAbstraction);
};

interface NamespaceCase {
    method: ReviewAppGatewayOperation;
    // What the app gateway answers on success.
    data: unknown;
    // Runs the routing gateway's operation for one namespace.
    run: (gateway: GatewayAbstraction.Interface, namespace: string) => Promise<unknown>;
    // What the app gateway must receive: its old parameter, without the routing field.
    sent: (namespace: string) => unknown;
}

const namespaceCases: NamespaceCase[] = [
    {
        method: "getTargetReview",
        data: createReviewWithFlagsDto(),
        run: (gateway, namespace) => {
            return gateway.getTargetReview({ namespace, targetRevisionId: REVISION_ID });
        },
        sent: namespace => ({ namespace, targetRevisionId: REVISION_ID })
    },
    {
        method: "getReview",
        data: createReviewWithFlagsDto(),
        run: (gateway, namespace) => gateway.getReview({ namespace, reviewId: "review-1" }),
        sent: () => "review-1"
    },
    {
        method: "listStepCandidates",
        data: [CANDIDATE],
        run: (gateway, namespace) => {
            return gateway.listStepCandidates({
                workflowId: "workflow-1",
                stepId: "step-1",
                target: { namespace, targetRevisionId: REVISION_ID }
            });
        },
        sent: namespace => ({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace, targetRevisionId: REVISION_ID }
        })
    },
    {
        method: "listReviewStepCandidates",
        data: [CANDIDATE],
        run: (gateway, namespace) => {
            return gateway.listReviewStepCandidates({
                namespace,
                reviewId: "review-1",
                stepId: "step-1"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "getStepRun",
        data: createStepRunInfoDto(),
        run: (gateway, namespace) => {
            return gateway.getStepRun({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                taskId: "task-1"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", taskId: "task-1" })
    },
    {
        method: "requestReview",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.requestReview({
                target: { namespace, targetRevisionId: REVISION_ID },
                title: "Launch article",
                picks: [{ stepId: "step-1", userId: "user-9" }]
            });
        },
        sent: namespace => ({
            target: { namespace, targetRevisionId: REVISION_ID },
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-9" }]
        })
    },
    {
        method: "startStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.startStep({ namespace, reviewId: "review-1", stepId: "step-1" });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "takeOverStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.takeOverStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                notifyPreviousOwner: true
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", notifyPreviousOwner: true })
    },
    {
        method: "reassignStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.reassignStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                userId: "user-9"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", userId: "user-9" })
    },
    {
        method: "approveStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.approveStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                comment: null
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", comment: null })
    },
    {
        method: "rejectStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.rejectStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                comment: "The headline is wrong."
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", comment: "The headline is wrong." })
    },
    {
        method: "cancelReview",
        data: createReviewDto(),
        run: (gateway, namespace) => gateway.cancelReview({ namespace, reviewId: "review-1" }),
        sent: () => ({ reviewId: "review-1" })
    },
    {
        method: "restartStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.restartStep({ namespace, reviewId: "review-1", stepId: "step-1" });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "cancelForDelete",
        data: [createReviewDto()],
        run: (gateway, namespace) => {
            return gateway.cancelForDelete({
                namespace,
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            });
        },
        sent: namespace => ({
            namespace,
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        })
    },
    {
        method: "listBlockingReviews",
        data: [createBlockingReviewDto()],
        run: (gateway, namespace) => {
            return gateway.listBlockingReviews({ namespace, targetIds: ["entry-1", "entry-2"] });
        },
        sent: namespace => ({ namespace, targetIds: ["entry-1", "entry-2"] })
    }
];

interface EnvelopeCase {
    method: ReviewAppGatewayOperation;
    run: (gateway: GatewayAbstraction.Interface) => Promise<unknown>;
}

const envelopeCases: EnvelopeCase[] = [
    { method: "listWorkflows", run: gateway => gateway.listWorkflows("cms") },
    { method: "listReviews", run: gateway => gateway.listReviews({ app: "cms", ...LIST_QUERY }) },
    ...namespaceCases.map((testCase): EnvelopeCase => {
        return {
            method: testCase.method,
            run: gateway => testCase.run(gateway, CMS_NAMESPACE)
        };
    })
];

// Missing data is an error for every operation except the two that answer `null` (R257).
const dataRequiredCases = envelopeCases.filter(testCase => {
    return testCase.method !== "getTargetReview" && testCase.method !== "getStepRun";
});

describe("ReviewGateway", () => {
    let cms: FakeReviewAppGateway;
    let wb: FakeReviewAppGateway;
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        cms = createFakeReviewAppGateway("cms", [CMS_NAMESPACE]);
        wb = createFakeReviewAppGateway("wb", [WB_NAMESPACE]);
        gateway = createGateway([cms, wb]);
    });

    describe("routing by namespace (R347, R348)", () => {
        it.each(namespaceCases)(
            "$method runs on the CMS gateway for a CMS namespace, with its old parameter",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: testCase.data, error: null });

                const result = await testCase.run(gateway, CMS_NAMESPACE);

                expect(result).toEqual(testCase.data);
                expect(cms[testCase.method]).toHaveBeenCalledTimes(1);
                expect(cms[testCase.method].mock.calls[0]).toStrictEqual([
                    testCase.sent(CMS_NAMESPACE)
                ]);
                expect(wb[testCase.method]).not.toHaveBeenCalled();
            }
        );

        it.each(namespaceCases)(
            "$method runs on the WB gateway for the page namespace, with its old parameter",
            async testCase => {
                wb[testCase.method].mockResolvedValue({ data: testCase.data, error: null });

                const result = await testCase.run(gateway, WB_NAMESPACE);

                expect(result).toEqual(testCase.data);
                expect(wb[testCase.method]).toHaveBeenCalledTimes(1);
                expect(wb[testCase.method].mock.calls[0]).toStrictEqual([
                    testCase.sent(WB_NAMESPACE)
                ]);
                expect(cms[testCase.method]).not.toHaveBeenCalled();
            }
        );
    });

    describe("routing by app (R348)", () => {
        it("lists the workflows of the given app and sends no parameter", async () => {
            wb.listWorkflows.mockResolvedValue({ data: [WORKFLOW], error: null });

            const result = await gateway.listWorkflows("wb");

            expect(result).toEqual([WORKFLOW]);
            expect(wb.listWorkflows.mock.calls[0]).toStrictEqual([]);
            expect(cms.listWorkflows).not.toHaveBeenCalled();
        });

        it("lists the reviews of the given app with the old parameter, and returns the data and the meta", async () => {
            const items = [createReviewWithFlagsDto()];
            cms.listReviews.mockResolvedValue({
                data: items,
                meta: { cursor: "cursor-2", hasMoreItems: true },
                error: null
            });

            const result = await gateway.listReviews({ app: "cms", ...LIST_QUERY });

            expect(result).toEqual({ data: items, meta: { cursor: "cursor-2", hasMoreItems: true } });
            expect(cms.listReviews.mock.calls[0]).toStrictEqual([LIST_QUERY]);
            expect(wb.listReviews).not.toHaveBeenCalled();
        });

        it("returns a missing meta as null, untouched (the repository defaults it)", async () => {
            wb.listReviews.mockResolvedValue({ data: [], meta: null, error: null });

            const result = await gateway.listReviews({ app: "wb", ...LIST_QUERY });

            expect(result).toEqual({ data: [], meta: null });
        });
    });

    describe("getApp", () => {
        it("answers the app of the gateway that claims the namespace", () => {
            expect(gateway.getApp(CMS_NAMESPACE)).toBe("cms");
            expect(gateway.getApp(WB_NAMESPACE)).toBe("wb");
        });

        it("throws a plain Error for a namespace no app claims (R361)", () => {
            const read = () => gateway.getApp("blog.post");

            expect(read).toThrow('No workflows app handles the namespace "blog.post".');
        });
    });

    describe("claims (R347, A114, A115)", () => {
        it("lets the first registered claimant win", async () => {
            const greedy = createFakeReviewAppGateway("wb", [CMS_NAMESPACE, WB_NAMESPACE]);
            const cmsFirst = createGateway([cms, greedy]);
            const greedyFirst = createGateway([greedy, cms]);
            cms.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });
            greedy.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });

            await cmsFirst.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            expect(cms.getReview).toHaveBeenCalledTimes(1);
            expect(greedy.getReview).not.toHaveBeenCalled();

            await greedyFirst.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            expect(greedy.getReview).toHaveBeenCalledTimes(1);
            expect(cms.getReview).toHaveBeenCalledTimes(1);
        });

        it("still routes when the same app is registered twice, and runs the operation once (A114)", async () => {
            const cmsAgain = createFakeReviewAppGateway("cms", [CMS_NAMESPACE]);
            const twice = createGateway([cms, cmsAgain, wb]);
            cms.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });
            cms.listWorkflows.mockResolvedValue({ data: [WORKFLOW], error: null });

            await twice.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            await twice.listWorkflows("cms");

            expect(cms.getReview).toHaveBeenCalledTimes(1);
            expect(cms.listWorkflows).toHaveBeenCalledTimes(1);
            expect(cmsAgain.getReview).not.toHaveBeenCalled();
            expect(cmsAgain.listWorkflows).not.toHaveBeenCalled();
            expect(twice.getApp(WB_NAMESPACE)).toBe("wb");
        });

        it("rejects with a plain Error for a namespace no app claims and calls no app gateway (R361)", async () => {
            const failure = await gateway
                .getReview({ namespace: "blog.post", reviewId: "review-1" })
                .catch(error => error);

            expect(failure).toBeInstanceOf(Error);
            expect(failure).not.toBeInstanceOf(GraphQLOperationError);
            expect(failure.message).toBe('No workflows app handles the namespace "blog.post".');
            expect(cms.getReview).not.toHaveBeenCalled();
            expect(wb.getReview).not.toHaveBeenCalled();
        });

        it("rejects with a plain Error for an app nobody registered", async () => {
            const cmsOnly = createGateway([cms]);

            await expect(cmsOnly.listWorkflows("wb")).rejects.toThrow(
                'No workflows app is registered for "wb".'
            );
            await expect(cmsOnly.listReviews({ app: "wb", ...LIST_QUERY })).rejects.toThrow(
                'No workflows app is registered for "wb".'
            );
            expect(cms.listWorkflows).not.toHaveBeenCalled();
            expect(cms.listReviews).not.toHaveBeenCalled();
        });
    });

    describe("envelopes (R346)", () => {
        it.each(envelopeCases)(
            "$method turns an error envelope into a GraphQLOperationError with code, data and message",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: null, meta: null, error: ERROR });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.code).toBe("Workflows/Review/StepNotCurrent");
                expect(failure.message).toBe("The step is not the current step.");
                expect(failure.data).toEqual({ reviewId: "review-1", stepId: "step-1" });
            }
        );

        it.each(envelopeCases)(
            "$method falls back to a generic message when the error carries none",
            async testCase => {
                cms[testCase.method].mockResolvedValue({
                    data: null,
                    meta: null,
                    error: { code: null, message: null, data: null }
                });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
                expect(failure.data).toBeNull();
            }
        );

        it.each(envelopeCases)("$method lets a transport rejection pass unchanged", async testCase => {
            const transport = new Error("Network down.");
            cms[testCase.method].mockRejectedValue(transport);

            await expect(testCase.run(gateway)).rejects.toBe(transport);
        });

        it.each(dataRequiredCases)(
            "$method throws when the server answers with neither data nor error",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: null, meta: null, error: null });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
            }
        );

        it("answers null for a revision without a review (R346)", async () => {
            cms.getTargetReview.mockResolvedValue({ data: null, error: null });

            const result = await gateway.getTargetReview({
                namespace: CMS_NAMESPACE,
                targetRevisionId: REVISION_ID
            });

            expect(result).toBeNull();
        });

        it("answers null for a step run whose task is gone (R257, R346)", async () => {
            cms.getStepRun.mockResolvedValue({ data: null, error: null });

            const result = await gateway.getStepRun({
                namespace: CMS_NAMESPACE,
                reviewId: "review-1",
                stepId: "step-1",
                taskId: "task-1"
            });

            expect(result).toBeNull();
        });

        it("lets a plain Error of an app gateway's namespace check pass unchanged (R361)", async () => {
            const check = new Error('Invalid app name: "cms.article".');
            cms.requestReview.mockRejectedValue(check);

            const failure = await gateway
                .requestReview({
                    target: { namespace: CMS_NAMESPACE, targetRevisionId: REVISION_ID },
                    title: "Launch article",
                    picks: []
                })
                .catch(error => error);

            expect(failure).toBe(check);
            expect(failure).not.toBeInstanceOf(GraphQLOperationError);
        });
    });
});
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts`: add the two claim tests as the first cases.

Before:

```ts
        gateway = container.resolve(GatewayAbstraction);
    });

    it("lists the CMS workflows without variables", async () => {
```

After:

```ts
        gateway = container.resolve(GatewayAbstraction);
    });

    it("serves the cms app (R347)", () => {
        expect(gateway.app).toBe("cms");
    });

    it("claims every CMS model namespace and nothing else (R347)", () => {
        expect(gateway.canHandle("cms.article")).toBe(true);
        expect(gateway.canHandle("cms.author")).toBe(true);
        expect(gateway.canHandle("wb.page")).toBe(false);
        expect(gateway.canHandle("cms")).toBe(false);
        expect(gateway.canHandle("cms.article.extra")).toBe(false);
        expect(gateway.canHandle("article")).toBe(false);
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("lists the CMS workflows without variables", async () => {
```

Modify `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts`:

Before:

```ts
        gateway = container.resolve(GatewayAbstraction);
    });

    it("lists the page workflows without variables", async () => {
```

After:

```ts
        gateway = container.resolve(GatewayAbstraction);
    });

    it("serves the wb app (R347)", () => {
        expect(gateway.app).toBe("wb");
    });

    it("claims only the page namespace (R347)", () => {
        expect(gateway.canHandle("wb.page")).toBe(true);
        expect(gateway.canHandle("wb.pages")).toBe(false);
        expect(gateway.canHandle("wb")).toBe(false);
        expect(gateway.canHandle("cms.article")).toBe(false);
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("lists the page workflows without variables", async () => {
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`.

Imports, before:

```ts
import { CmsReviewUseCases } from "./CmsReviewUseCases/abstractions.js";
import { CmsReviewFeature } from "./feature.js";
```

After:

```ts
import { CmsReviewUseCases } from "./CmsReviewUseCases/abstractions.js";
import { CmsReviewFeature } from "./feature.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

Add a case after "registers every token as a singleton". Before:

```ts
        expect(gateway1).toBe(gateway2);
        expect(useCases1).toBe(useCases2);
        expect(adapter1).toBe(adapter2);
    });
```

After:

```ts
        expect(gateway1).toBe(gateway2);
        expect(useCases1).toBe(useCases2);
        expect(adapter1).toBe(adapter2);
    });

    it("registers only its own bridge under the shared ReviewAppGateway token, as a singleton (R356, R362)", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryReview: { data: null, error: null } }
        });
        const appGateways = container.resolveAll(ReviewAppGateway);

        expect(appGateways).toHaveLength(1);
        expect(appGateways[0].app).toBe("cms");
        expect(appGateways[0].canHandle("cms.article")).toBe(true);
        expect(appGateways[0].canHandle("wb.page")).toBe(false);
        expect(container.resolveAll(ReviewAppGateway)[0]).toBe(appGateways[0]);

        await appGateways[0].getReview("review-1");

        expect(client.execute.mock.calls[0][0].query).toContain("getCmsEntryReview");
    });
```

Modify `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`.

Imports, before:

```ts
import { WbReviewUseCases } from "./WbReviewUseCases/abstractions.js";
import { WbReviewFeature } from "./feature.js";
```

After:

```ts
import { WbReviewUseCases } from "./WbReviewUseCases/abstractions.js";
import { WbReviewFeature } from "./feature.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

Add a case after "registers every token as a singleton". Before:

```ts
        expect(firstGateway).toBe(secondGateway);
        expect(firstUseCases).toBe(secondUseCases);
        expect(firstAdapter).toBe(secondAdapter);
    });
```

After:

```ts
        expect(firstGateway).toBe(secondGateway);
        expect(firstUseCases).toBe(secondUseCases);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("registers only its own bridge under the shared ReviewAppGateway token, as a singleton (R356, R362)", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReview: { data: null, error: null } }
        });
        const appGateways = container.resolveAll(ReviewAppGateway);

        expect(appGateways).toHaveLength(1);
        expect(appGateways[0].app).toBe("wb");
        expect(appGateways[0].canHandle("wb.page")).toBe(true);
        expect(appGateways[0].canHandle("cms.article")).toBe(false);
        expect(container.resolveAll(ReviewAppGateway)[0]).toBe(appGateways[0]);

        await appGateways[0].getReview("review-1");

        expect(client.execute.mock.calls[0][0].query).toContain("getWebsiteBuilderPageReview");
    });
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (the review half of Review Focus 10, R362). Task 6 changed this file for the editor half; the hunks below anchor on lines Task 6 does not touch.

Imports, before:

```ts
import { createFolder } from "~/testing/createFolder.js";
import { CmsWorkflows } from "./index.js";
```

After:

```ts
import { createFolder } from "~/testing/createFolder.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { ReviewGateway as ReviewGatewayAbstraction } from "@webiny/app-workflows/review/gateway/abstractions.js";
import { ReviewGateway } from "@webiny/app-workflows/review/gateway/ReviewGateway.js";
import { createFakeReviewAppGateway } from "@webiny/app-workflows/review/testing/fakeReviewAppGateway.js";
import { createReviewDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsWorkflows } from "./index.js";
```

Append these cases inside `describe("CmsWorkflows composition", ...)`, directly before its closing `});` (the last line of the file):

```tsx
    it("registers the CMS review app gateway under the shared token only with the flag on (R356)", () => {
        const enabled = createContainer(true);
        const disabled = createContainer(false);

        render(
            <DiContainerProvider container={enabled}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        render(
            <DiContainerProvider container={disabled}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["cms"]);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
    });

    it("routes CMS namespaces to the CMS gateway and the page namespace to the other app, built after the render (Review Focus 10, R362)", async () => {
        const container = createContainer(true);
        // The data features of app-workflows; Task 8 registers ReviewServicesFeature instead.
        container.register(ReviewGateway).inSingletonScope();
        const wbStub = createFakeReviewAppGateway("wb", ["wb.page"]);
        const phases: string[] = [];
        let phase = "render";
        // The routing gateway collects the app gateways once, when it is built (R349).
        container.registerFactory(ReviewAppGateway, () => {
            phases.push(phase);
            return wbStub;
        });

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        phase = "after";

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: { getCmsEntryReview: { data: createReviewWithFlagsDto(), error: null } }
        });
        const pageReviewDto = createReviewDto({ id: "review-2" });
        const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
        wbStub.getReview.mockResolvedValue({ data: pageReview, error: null });

        const cmsReview = await gateway.getReview({ namespace: "cms.article", reviewId: "review-1" });
        const wbReview = await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });

        expect(phases).toEqual(["after"]);
        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(gateway.getApp("wb.page")).toBe("wb");
        expect(cmsReview.review.id).toBe("review-1");
        expect(wbReview.review.id).toBe("review-2");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryReview("))).toHaveLength(1);
        expect(wbStub.getReview).toHaveBeenCalledWith("review-2");
    });
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx` the same way, plus the review half of the three-root test (R362: only this package can render all three roots, because it depends on the CMS package). Task 6 already added to this file the imports `CompositionProvider` (`@webiny/react-composition`), `WorkflowsAdminApp` (`@webiny/app-workflows/app.js`) and `CmsWorkflows` (`@webiny/app-headless-cms-workflows/index.js`) and the module mocks that stub the UI of the `app-workflows` and CMS roots for its editor three-root test; this task reuses them and adds no mock.

Imports, before:

```ts
import { createFolder } from "~/testing/createFolder.js";
import { WebsiteBuilderWorkflows } from "./index.js";
```

After:

```ts
import { createFolder } from "~/testing/createFolder.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { ReviewGateway as ReviewGatewayAbstraction } from "@webiny/app-workflows/review/gateway/abstractions.js";
import { ReviewGateway } from "@webiny/app-workflows/review/gateway/ReviewGateway.js";
import { createFakeReviewAppGateway } from "@webiny/app-workflows/review/testing/fakeReviewAppGateway.js";
import { createReviewDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { WebsiteBuilderWorkflows } from "./index.js";
```

Append these cases inside `describe("WebsiteBuilderWorkflows composition", ...)`, directly before its closing `});` (the last line of the file):

```tsx
    it("registers the WB review app gateway under the shared token only with the flag on (R356)", () => {
        const enabled = createContainer(true);
        const disabled = createContainer(false);

        render(
            <DiContainerProvider container={enabled}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        render(
            <DiContainerProvider container={disabled}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["wb"]);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
    });

    it("routes the page namespace to the WB gateway and CMS namespaces to the other app, built after the render (Review Focus 10, R362)", async () => {
        const container = createContainer(true);
        // The data features of app-workflows; Task 8 registers ReviewServicesFeature instead.
        container.register(ReviewGateway).inSingletonScope();
        const cmsStub = createFakeReviewAppGateway("cms", ["cms.article"]);
        const phases: string[] = [];
        let phase = "render";
        container.registerFactory(ReviewAppGateway, () => {
            phases.push(phase);
            return cmsStub;
        });

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        phase = "after";

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        const pageReviewDto = createReviewDto({ id: "review-2" });
        const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReview: { data: pageReview, error: null } }
        });
        cmsStub.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });

        const wbReview = await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });
        const cmsReview = await gateway.getReview({ namespace: "cms.article", reviewId: "review-1" });

        expect(phases).toEqual(["after"]);
        expect(gateway.getApp("wb.page")).toBe("wb");
        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(wbReview.review.id).toBe("review-2");
        expect(cmsReview.review.id).toBe("review-1");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getWebsiteBuilderPageReview("))).toHaveLength(1);
        expect(cmsStub.getReview).toHaveBeenCalledWith("review-1");
    });

    it("routes cms.article to CMS and wb.page to WB when the three roots render in the admin's order (Review Focus 10, R349, R362)", async () => {
        const container = createContainer(true);
        // Task 8 drops this line: WorkflowsAdminApp registers ReviewGateway through ReviewServicesFeature.
        container.register(ReviewGateway).inSingletonScope();

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    <WorkflowsAdminApp />
                    <CmsWorkflows />
                    <WebsiteBuilderWorkflows />
                </CompositionProvider>
            </DiContainerProvider>
        );

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockImplementation(async (request: MainGraphQLClient.Request) => {
            const query = request.query as string;
            if (query.includes("getCmsEntryReview")) {
                return { cms: { getCmsEntryReview: { data: createReviewWithFlagsDto(), error: null } } };
            }
            const pageReviewDto = createReviewDto({ id: "review-2" });
            const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
            return {
                websiteBuilder: { getWebsiteBuilderPageReview: { data: pageReview, error: null } }
            };
        });

        await gateway.getReview({ namespace: "cms.article", reviewId: "review-1" });
        await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });

        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(gateway.getApp("wb.page")).toBe("wb");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryReview("))).toHaveLength(1);
        expect(queries.filter(query => query.includes("getWebsiteBuilderPageReview("))).toHaveLength(1);
    });
```

(The render only registers features, as in Task 6's editor three-root test, so the WB `createContainer` is enough; instance registrations win over the class registrations `WorkflowsAdminApp` adds. `GET_CMS_ENTRY_REVIEW` and `GET_WEBSITE_BUILDER_PAGE_REVIEW` contain `getCmsEntryReview(id: $id)` and `getWebsiteBuilderPageReview(id: $id)`, verified, so the `(` keeps the step-run queries out of the count.)

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/gateway/ReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: `ReviewGateway.test.ts` fails with `Failed to resolve import "./abstractions.js"` (and `~/review/appGateway/abstractions.js` from the fake). The two app gateway tests fail the new cases (`gateway.app` is `undefined`, `gateway.canHandle is not a function`) and pass the rest. The feature tests and the index tests fail to resolve `@webiny/app-workflows/review/appGateway/abstractions.js`. Record the RED output.

- [ ] **Step 3: Implement**

Move the app contract:

```bash
mkdir -p packages/app-workflows/src/review/appGateway
git mv packages/app-workflows/src/review/gateway/IReviewGateway.ts packages/app-workflows/src/review/appGateway/IReviewAppGateway.ts
```

Modify `packages/app-workflows/src/review/appGateway/IReviewAppGateway.ts`. The DTO imports now leave the folder.

Before:

```ts
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewEnvelope } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListEnvelope } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { BlockingReviewDto } from "~/review/gateway/dto.js";
import type { ReviewEnvelope } from "~/review/gateway/dto.js";
import type { ReviewDto } from "~/review/gateway/dto.js";
import type { ReviewListEnvelope } from "~/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "~/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "~/review/gateway/dto.js";
import type { StepCandidateDto } from "~/review/gateway/dto.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
```

Before:

```ts
/*
 * The review operations one app exposes over its own GraphQL documents (R202). Every method
 * resolves with the shared envelope, also when the server reports an error, and rejects only on a
 * transport failure (R204). There is no abstraction token here: each app creates its own over this
 * interface.
 */
export interface IReviewGateway {
    listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>>;
```

After:

```ts
/*
 * The review operations one app exposes over its own GraphQL documents (R202, R347). Every
 * envelope method resolves with the shared envelope, also when the server reports an error, and
 * rejects only on a transport failure (R204); `ReviewGateway` unwraps it once for every app. Each
 * app registers its class under the shared `ReviewAppGateway` token (`./abstractions.ts`).
 */
export interface IReviewAppGateway {
    // The app this gateway serves; the app-wide lists route by it.
    readonly app: WorkflowAppKind;
    // True for a namespace of this app (`cms.<modelId>`, `wb.page`); review-bound operations route by it.
    canHandle(namespace: string): boolean;
    listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>>;
```

Create `packages/app-workflows/src/review/appGateway/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "./IReviewAppGateway.js";

/*
 * The review gateway of one app (R347). The CMS and the Website Builder each register their class
 * under this one token, so both coexist; `ReviewGateway` collects them and routes every call.
 */
export const ReviewAppGateway = createAbstraction<IReviewAppGateway>("Workflows/ReviewAppGateway");

export namespace ReviewAppGateway {
    export type Interface = IReviewAppGateway;
}
```

Repoint every importer of the moved file (13 files: the 4 `IReview*UseCases.ts`, `ReviewUseCases.ts`, `ReviewUseCases.test.ts`, `RequestReviewPresenter.ts`, `ReviewListPresenter.ts`, `ActiveReviewGuard.test.ts`, the CMS and WB gateway classes and `abstractions.ts`, the 7 CMS and WB trash tests):

```bash
grep -rl "review/gateway/IReviewGateway.js" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src | xargs sed -i '' 's#review/gateway/IReviewGateway\.js#review/appGateway/IReviewAppGateway.js#g'
grep -rn "review/gateway/IReviewGateway" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

Expected: the second command prints nothing. Then rename the interface where it is named (4 files):

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`.

Before:

```ts
import type { IReviewGateway } from "~/review/appGateway/IReviewAppGateway.js";
```

After:

```ts
import type { IReviewAppGateway } from "~/review/appGateway/IReviewAppGateway.js";
```

Before:

```ts
    constructor(private gateway: IReviewGateway) {}
```

After:

```ts
    constructor(private gateway: IReviewAppGateway) {}
```

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts` (deleted by Task 14; this only keeps it compiling and green).

Before:

```ts
import type { IReviewGateway } from "~/review/appGateway/IReviewAppGateway.js";
```

After:

```ts
import type { IReviewAppGateway } from "~/review/appGateway/IReviewAppGateway.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
type FakeGateway = { [K in keyof IReviewGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listWorkflows: vi.fn(),
```

After:

```ts
type GatewayOperation = Exclude<keyof IReviewAppGateway, "app" | "canHandle">;

type FakeGatewayMethods = { [K in GatewayOperation]: Mock };

interface FakeGateway extends FakeGatewayMethods {
    readonly app: WorkflowAppKind;
    canHandle: Mock;
}

const createFakeGateway = (): FakeGateway => {
    return {
        app: "cms",
        canHandle: vi.fn().mockReturnValue(true),
        listWorkflows: vi.fn(),
```

Before:

```ts
interface OperationCase {
    name: string;
    method: keyof IReviewGateway;
```

After:

```ts
interface OperationCase {
    name: string;
    method: GatewayOperation;
```

Before:

```ts
        const GatewayA = createAbstraction<IReviewGateway>("Test/GatewayA");
        const GatewayB = createAbstraction<IReviewGateway>("Test/GatewayB");
```

After:

```ts
        const GatewayA = createAbstraction<IReviewAppGateway>("Test/GatewayA");
        const GatewayB = createAbstraction<IReviewAppGateway>("Test/GatewayB");
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/abstractions.ts` (whole file after):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";

// The CMS token the per-app review use cases still run on; Task 14 removes it (R356).
export const CmsReviewGateway = createAbstraction<IReviewAppGateway>("Cms/Workflows/ReviewGateway");

export namespace CmsReviewGateway {
    export type Interface = IReviewAppGateway;
}
```

Modify `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/abstractions.ts` (whole file after):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";

// The WB token the per-app review use cases still run on; Task 14 removes it (R356).
export const WbReviewGateway = createAbstraction<IReviewAppGateway>(
    "WebsiteBuilder/Workflows/ReviewGateway"
);

export namespace WbReviewGateway {
    export type Interface = IReviewAppGateway;
}
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.ts`.

Before:

```ts
import { parseAppName } from "~/utils/appName.js";
```

After:

```ts
import type { WorkflowAppKind } from "@webiny/app-workflows/domain/WorkflowAppKind.js";
import { isCmsAppName } from "~/utils/appName.js";
import { parseAppName } from "~/utils/appName.js";
```

Before:

```ts
class CmsReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
```

After:

```ts
class CmsReviewGatewayImpl implements GatewayAbstraction.Interface {
    public readonly app: WorkflowAppKind = "cms";

    constructor(private client: MainGraphQLClient.Interface) {}

    // Every `cms.<modelId>` namespace (R347).
    canHandle(namespace: string): boolean {
        return isCmsAppName(namespace);
    }

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
```

Modify `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.ts`.

Before:

```ts
import { WbReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { assertWbPageNamespace } from "../assertWbPageNamespace.js";
```

After:

```ts
import type { WorkflowAppKind } from "@webiny/app-workflows/domain/WorkflowAppKind.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { assertWbPageNamespace } from "../assertWbPageNamespace.js";
```

Before:

```ts
class WbReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
```

After:

```ts
class WbReviewGatewayImpl implements GatewayAbstraction.Interface {
    public readonly app: WorkflowAppKind = "wb";

    constructor(private client: MainGraphQLClient.Interface) {}

    // Only the page namespace (R347).
    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
```

Create `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewAppGateway/CmsReviewAppGateway.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewGateway } from "../CmsReviewGateway/CmsReviewGateway.js";

/*
 * A bridge (R356): `CmsReviewGateway` is still bound to the CMS token that the old review use
 * cases run on, and `createImplementation` stores one abstraction on a class, so the shared
 * `ReviewAppGateway` binding goes on an empty subclass. Task 14 binds `CmsReviewGateway` itself
 * and deletes this file.
 */
class CmsReviewAppGatewayImpl extends CmsReviewGateway implements GatewayAbstraction.Interface {}

export const CmsReviewAppGateway = GatewayAbstraction.createImplementation({
    implementation: CmsReviewAppGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-website-builder-workflows/src/features/gateway/WbReviewAppGateway/WbReviewAppGateway.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { WbReviewGateway } from "../WbReviewGateway/WbReviewGateway.js";

/*
 * A bridge (R356): `WbReviewGateway` is still bound to the WB token that the old review use cases
 * run on, and `createImplementation` stores one abstraction on a class, so the shared
 * `ReviewAppGateway` binding goes on an empty subclass. Task 14 binds `WbReviewGateway` itself and
 * deletes this file.
 */
class WbReviewAppGatewayImpl extends WbReviewGateway implements GatewayAbstraction.Interface {}

export const WbReviewAppGateway = GatewayAbstraction.createImplementation({
    implementation: WbReviewAppGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`.

Before:

```ts
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases/CmsReviewUseCases.js";
```

After:

```ts
import { CmsReviewAppGateway } from "./CmsReviewAppGateway/CmsReviewAppGateway.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases/CmsReviewUseCases.js";
```

Before:

```ts
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
```

After:

```ts
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewAppGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
```

Modify `packages/app-website-builder-workflows/src/features/gateway/feature.ts`.

Before:

```ts
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
```

After:

```ts
import { WbReviewAppGateway } from "./WbReviewAppGateway/WbReviewAppGateway.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
```

Before:

```ts
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewUseCases).inSingletonScope();
```

After:

```ts
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewAppGateway).inSingletonScope();
        container.register(WbReviewUseCases).inSingletonScope();
```

Modify `packages/app-workflows/src/review/gateway/dto.ts`: append after `ReviewListEnvelope`.

Before:

```ts
export interface ReviewListEnvelope {
    data: ReviewWithFlagsDto[] | null;
    meta: ReviewListMeta | null;
    error: ReviewErrorDto | null;
}
```

After:

```ts
export interface ReviewListEnvelope {
    data: ReviewWithFlagsDto[] | null;
    meta: ReviewListMeta | null;
    error: ReviewErrorDto | null;
}

// A review list page as `ReviewGateway` returns it: the envelope without its error (R346).
export interface ReviewListResultDto {
    data: ReviewWithFlagsDto[];
    meta: ReviewListMeta | null;
}
```

Create the 17 per-operation contracts. Each file is complete as shown; the R360 sentence is the same in every interface comment.

`packages/app-workflows/src/review/useCases/getBoundWorkflow/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewWorkflow } from "~/review/domain/types.js";

export interface GetBoundWorkflowUseCaseParams {
    namespace: string;
}

/*
 * The workflow that binds the namespace, or `null` when none does. The workflow list is read once
 * per app and cached by `ReviewRepository` until a store or a delete clears it (R350). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IGetBoundWorkflowUseCase {
    execute(params: GetBoundWorkflowUseCaseParams): Promise<ReviewWorkflow | null>;
}

export const GetBoundWorkflowUseCase = createAbstraction<IGetBoundWorkflowUseCase>(
    "Workflows/GetBoundWorkflowUseCase"
);

export namespace GetBoundWorkflowUseCase {
    export type Interface = IGetBoundWorkflowUseCase;
    export type Params = GetBoundWorkflowUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/getTargetReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";

/*
 * The review of a content revision with the viewer's flags, or `null` when the revision has none
 * (a value, not an error). Throws a `GraphQLOperationError` for a server error and the transport
 * `Error` as is (R360).
 */
export interface IGetTargetReviewUseCase {
    execute(params: ReviewTarget): Promise<ReviewWithFlags | null>;
}

export const GetTargetReviewUseCase = createAbstraction<IGetTargetReviewUseCase>(
    "Workflows/GetTargetReviewUseCase"
);

export namespace GetTargetReviewUseCase {
    export type Interface = IGetTargetReviewUseCase;
    export type Params = ReviewTarget;
}
```

`packages/app-workflows/src/review/useCases/getReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewWithFlags } from "~/review/domain/types.js";

export interface GetReviewUseCaseParams {
    namespace: string;
    reviewId: string;
}

/*
 * One review with the viewer's flags. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IGetReviewUseCase {
    execute(params: GetReviewUseCaseParams): Promise<ReviewWithFlags>;
}

export const GetReviewUseCase = createAbstraction<IGetReviewUseCase>("Workflows/GetReviewUseCase");

export namespace GetReviewUseCase {
    export type Interface = IGetReviewUseCase;
    export type Params = GetReviewUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/listStepCandidates/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ListStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { StepCandidate } from "~/review/domain/types.js";

/*
 * The people who may review a step of a workflow for a content revision, before the review exists.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IListStepCandidatesUseCase {
    execute(params: ListStepCandidatesParams): Promise<StepCandidate[]>;
}

export const ListStepCandidatesUseCase = createAbstraction<IListStepCandidatesUseCase>(
    "Workflows/ListStepCandidatesUseCase"
);

export namespace ListStepCandidatesUseCase {
    export type Interface = IListStepCandidatesUseCase;
    export type Params = ListStepCandidatesParams;
}
```

`packages/app-workflows/src/review/useCases/listReviewStepCandidates/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ListReviewStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { StepCandidate } from "~/review/domain/types.js";

export interface ListReviewStepCandidatesUseCaseParams extends ListReviewStepCandidatesParams {
    namespace: string;
}

/*
 * The people a step of an existing review may be reassigned to. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
 */
export interface IListReviewStepCandidatesUseCase {
    execute(params: ListReviewStepCandidatesUseCaseParams): Promise<StepCandidate[]>;
}

export const ListReviewStepCandidatesUseCase = createAbstraction<IListReviewStepCandidatesUseCase>(
    "Workflows/ListReviewStepCandidatesUseCase"
);

export namespace ListReviewStepCandidatesUseCase {
    export type Interface = IListReviewStepCandidatesUseCase;
    export type Params = ListReviewStepCandidatesUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/getStepRun/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { GetStepRunParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";

export interface GetStepRunUseCaseParams extends GetStepRunParams {
    namespace: string;
}

/*
 * What happened in one run of an automated step, or `null` when its task record is gone (R257, a
 * value, not an error). Throws a `GraphQLOperationError` for a server error and the transport
 * `Error` as is (R360).
 */
export interface IGetStepRunUseCase {
    execute(params: GetStepRunUseCaseParams): Promise<ReviewStepRunInfo | null>;
}

export const GetStepRunUseCase = createAbstraction<IGetStepRunUseCase>("Workflows/GetStepRunUseCase");

export namespace GetStepRunUseCase {
    export type Interface = IGetStepRunUseCase;
    export type Params = GetStepRunUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/listReviews/abstractions.ts` (`ReviewListPage` moves to `~/review/domain/ReviewListPage.js` in Task 8, which repoints this import):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";

export interface ListReviewsUseCaseParams extends ListReviewsParams {
    app: WorkflowAppKind;
}

/*
 * One page of the app's Content Reviews list; a missing meta reads as no more items. Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IListReviewsUseCase {
    execute(params: ListReviewsUseCaseParams): Promise<ReviewListPage>;
}

export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>(
    "Workflows/ListReviewsUseCase"
);

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Params = ListReviewsUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/requestReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { RequestReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

/*
 * Starts a review of a content revision. Throws a `GraphQLOperationError` for a server error and
 * the transport `Error` as is (R360).
 */
export interface IRequestReviewUseCase {
    execute(params: RequestReviewParams): Promise<Review>;
}

export const RequestReviewUseCase = createAbstraction<IRequestReviewUseCase>(
    "Workflows/RequestReviewUseCase"
);

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
    export type Params = RequestReviewParams;
}
```

`packages/app-workflows/src/review/useCases/startReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewStepRef } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface StartReviewStepUseCaseParams extends ReviewStepRef {
    namespace: string;
}

/*
 * The viewer starts reviewing a step. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IStartReviewStepUseCase {
    execute(params: StartReviewStepUseCaseParams): Promise<Review>;
}

export const StartReviewStepUseCase = createAbstraction<IStartReviewStepUseCase>(
    "Workflows/StartReviewStepUseCase"
);

export namespace StartReviewStepUseCase {
    export type Interface = IStartReviewStepUseCase;
    export type Params = StartReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/takeOverReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { TakeOverReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface TakeOverReviewStepUseCaseParams extends TakeOverReviewParams {
    namespace: string;
}

/*
 * The viewer takes over a step another person owns. Throws a `GraphQLOperationError` for a server
 * error and the transport `Error` as is (R360).
 */
export interface ITakeOverReviewStepUseCase {
    execute(params: TakeOverReviewStepUseCaseParams): Promise<Review>;
}

export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "Workflows/TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Params = TakeOverReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/reassignReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReassignReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface ReassignReviewStepUseCaseParams extends ReassignReviewParams {
    namespace: string;
}

/*
 * Gives a step to another reviewer. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IReassignReviewStepUseCase {
    execute(params: ReassignReviewStepUseCaseParams): Promise<Review>;
}

export const ReassignReviewStepUseCase = createAbstraction<IReassignReviewStepUseCase>(
    "Workflows/ReassignReviewStepUseCase"
);

export namespace ReassignReviewStepUseCase {
    export type Interface = IReassignReviewStepUseCase;
    export type Params = ReassignReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/approveReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ApproveReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface ApproveReviewStepUseCaseParams extends ApproveReviewParams {
    namespace: string;
}

/*
 * Approves a step, with an optional comment. Throws a `GraphQLOperationError` for a server error
 * and the transport `Error` as is (R360).
 */
export interface IApproveReviewStepUseCase {
    execute(params: ApproveReviewStepUseCaseParams): Promise<Review>;
}

export const ApproveReviewStepUseCase = createAbstraction<IApproveReviewStepUseCase>(
    "Workflows/ApproveReviewStepUseCase"
);

export namespace ApproveReviewStepUseCase {
    export type Interface = IApproveReviewStepUseCase;
    export type Params = ApproveReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/rejectReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { RejectReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface RejectReviewStepUseCaseParams extends RejectReviewParams {
    namespace: string;
}

/*
 * Rejects a step with a comment. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IRejectReviewStepUseCase {
    execute(params: RejectReviewStepUseCaseParams): Promise<Review>;
}

export const RejectReviewStepUseCase = createAbstraction<IRejectReviewStepUseCase>(
    "Workflows/RejectReviewStepUseCase"
);

export namespace RejectReviewStepUseCase {
    export type Interface = IRejectReviewStepUseCase;
    export type Params = RejectReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/cancelReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { CancelReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface CancelReviewUseCaseParams extends CancelReviewParams {
    namespace: string;
}

/*
 * Cancels a review. Throws a `GraphQLOperationError` for a server error and the transport `Error`
 * as is (R360).
 */
export interface ICancelReviewUseCase {
    execute(params: CancelReviewUseCaseParams): Promise<Review>;
}

export const CancelReviewUseCase = createAbstraction<ICancelReviewUseCase>(
    "Workflows/CancelReviewUseCase"
);

export namespace CancelReviewUseCase {
    export type Interface = ICancelReviewUseCase;
    export type Params = CancelReviewUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/restartReviewStep/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewStepRef } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface RestartReviewStepUseCaseParams extends ReviewStepRef {
    namespace: string;
}

/*
 * Runs a failed automated step again. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IRestartReviewStepUseCase {
    execute(params: RestartReviewStepUseCaseParams): Promise<Review>;
}

export const RestartReviewStepUseCase = createAbstraction<IRestartReviewStepUseCase>(
    "Workflows/RestartReviewStepUseCase"
);

export namespace RestartReviewStepUseCase {
    export type Interface = IRestartReviewStepUseCase;
    export type Params = RestartReviewStepUseCaseParams;
}
```

`packages/app-workflows/src/review/useCases/cancelReviewsForDelete/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

/*
 * Cancels the reviews in progress of a target that is about to be trashed or deleted (R265);
 * `targetRevisionId: null` cancels every revision's review. Throws a `GraphQLOperationError` for a
 * server error and the transport `Error` as is (R360).
 */
export interface ICancelReviewsForDeleteUseCase {
    execute(params: CancelForDeleteParams): Promise<Review[]>;
}

export const CancelReviewsForDeleteUseCase = createAbstraction<ICancelReviewsForDeleteUseCase>(
    "Workflows/CancelReviewsForDeleteUseCase"
);

export namespace CancelReviewsForDeleteUseCase {
    export type Interface = ICancelReviewsForDeleteUseCase;
    export type Params = CancelForDeleteParams;
}
```

`packages/app-workflows/src/review/useCases/listBlockingReviews/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ListBlockingReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { BlockingReview } from "~/review/domain/types.js";

/*
 * The reviews in progress of the given targets, for the bulk pre-check (R265). The Website
 * Builder answers an empty list without a request. Throws a `GraphQLOperationError` for a server
 * error and the transport `Error` as is (R360).
 */
export interface IListBlockingReviewsUseCase {
    execute(params: ListBlockingReviewsParams): Promise<BlockingReview[]>;
}

export const ListBlockingReviewsUseCase = createAbstraction<IListBlockingReviewsUseCase>(
    "Workflows/ListBlockingReviewsUseCase"
);

export namespace ListBlockingReviewsUseCase {
    export type Interface = IListBlockingReviewsUseCase;
    export type Params = ListBlockingReviewsParams;
}
```

Create `packages/app-workflows/src/review/gateway/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListResultDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
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
 * The app-neutral review gateway (R347). It routes each call to the app gateway that serves it
 * and unwraps the envelope (R346): it returns DTOs and throws a `GraphQLOperationError` for an
 * error envelope or missing data (`getTargetReview` and `getStepRun` answer `null` as a value).
 * A transport `Error`, and a plain `Error` of an app gateway, pass as is. A namespace or an app
 * nobody claims throws a plain `Error` (R361).
 */
export interface IReviewGateway {
    // The app of the gateway that claims the namespace; the workflow cache key (R350).
    getApp(namespace: string): WorkflowAppKind;
    listWorkflows(app: WorkflowAppKind): Promise<WorkflowDto[]>;
    getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlagsDto | null>;
    getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlagsDto>;
    listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidateDto[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidateDto[]>;
    getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfoDto | null>;
    listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListResultDto>;
    requestReview(params: RequestReviewUseCase.Params): Promise<ReviewDto>;
    startStep(params: StartReviewStepUseCase.Params): Promise<ReviewDto>;
    takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<ReviewDto>;
    reassignStep(params: ReassignReviewStepUseCase.Params): Promise<ReviewDto>;
    approveStep(params: ApproveReviewStepUseCase.Params): Promise<ReviewDto>;
    rejectStep(params: RejectReviewStepUseCase.Params): Promise<ReviewDto>;
    cancelReview(params: CancelReviewUseCase.Params): Promise<ReviewDto>;
    restartStep(params: RestartReviewStepUseCase.Params): Promise<ReviewDto>;
    cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<ReviewDto[]>;
    listBlockingReviews(params: ListBlockingReviewsUseCase.Params): Promise<BlockingReviewDto[]>;
}

export const ReviewGateway = createAbstraction<IReviewGateway>("Workflows/ReviewGateway");

export namespace ReviewGateway {
    export type Interface = IReviewGateway;
}
```

Create `packages/app-workflows/src/review/gateway/ReviewGateway.ts`:

```ts
import { toOperationError } from "~/gateway/toOperationError.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { ReviewAppGateway } from "~/review/appGateway/abstractions.js";
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListResultDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
import { ReviewGateway as GatewayAbstraction } from "./abstractions.js";
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
 * Routes every review operation to the app gateway that serves it (R347): a review-bound
 * operation to the first gateway whose `canHandle(namespace)` is true, an app-wide list to the
 * first whose `app` matches. The app gateway gets the parameter object it always took, so no
 * GraphQL variable changes. The envelope is unwrapped here, once for every app (R346).
 *
 * Registration order (R349): this singleton collects the app gateways when it is first built.
 * Nothing that renders in the plugin pass may resolve it, or a repository or use case built on
 * it; route elements, editors and widgets resolve it after every app has registered.
 */
class ReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private appGateways: ReviewAppGateway.Interface[]) {}

    getApp(namespace: string): WorkflowAppKind {
        const appGateway = this.forNamespace(namespace);
        return appGateway.app;
    }

    async listWorkflows(app: WorkflowAppKind): Promise<WorkflowDto[]> {
        const appGateway = this.forApp(app);
        const envelope = await appGateway.listWorkflows();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getTargetReview(
        params: GetTargetReviewUseCase.Params
    ): Promise<ReviewWithFlagsDto | null> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getTargetReview(params);
        if (envelope.error) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlagsDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getReview(params.reviewId);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listStepCandidates(
        params: ListStepCandidatesUseCase.Params
    ): Promise<StepCandidateDto[]> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.listStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidateDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.listReviewStepCandidates({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfoDto | null> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getStepRun({
            reviewId: params.reviewId,
            stepId: params.stepId,
            taskId: params.taskId
        });
        if (envelope.error) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListResultDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.listReviews({
            list: params.list,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return { data: envelope.data, meta: envelope.meta };
    }

    async requestReview(params: RequestReviewUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.requestReview(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async startStep(params: StartReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.startStep({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.takeOverStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            notifyPreviousOwner: params.notifyPreviousOwner
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async reassignStep(params: ReassignReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.reassignStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            userId: params.userId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async approveStep(params: ApproveReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.approveStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            comment: params.comment
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async rejectStep(params: RejectReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.rejectStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            comment: params.comment
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async cancelReview(params: CancelReviewUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelReview({ reviewId: params.reviewId });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async restartStep(params: RestartReviewStepUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.restartStep({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<ReviewDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelForDelete(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listBlockingReviews(
        params: ListBlockingReviewsUseCase.Params
    ): Promise<BlockingReviewDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.listBlockingReviews(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    private forNamespace(namespace: string): ReviewAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.canHandle(namespace));
        if (!appGateway) {
            throw new Error(`No workflows app handles the namespace "${namespace}".`);
        }
        return appGateway;
    }

    private forApp(app: WorkflowAppKind): ReviewAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.app === app);
        if (!appGateway) {
            throw new Error(`No workflows app is registered for "${app}".`);
        }
        return appGateway;
    }
}

export const ReviewGateway = GatewayAbstraction.createImplementation({
    implementation: ReviewGatewayImpl,
    dependencies: [[ReviewAppGateway, { multiple: true }]]
});
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
yarn test packages/app-workflows/src/review/gateway/ReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: PASS. If the three-root test fails while rendering `WorkflowsAdminApp` or `CmsWorkflows` (a missing registration or a component that needs a provider), add the missing fake registration to that test only, as `[AW]/app.test.tsx` and `[CMS]/index.test.tsx` do; never change source code for it.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages (the builds type-check the co-located tests, R243).

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
git commit -m "refactor(app-workflows): route review calls through per-app gateways behind ReviewGateway" -m "The CMS and Website Builder review gateways serve an app and claim their namespaces, and are registered under the shared ReviewAppGateway token through bridge subclasses (app-headless-cms-workflows, app-website-builder-workflows). The app-neutral ReviewGateway picks the app gateway by namespace or by app, sends the parameter object each app gateway always took and unwraps the envelope once. The 17 review use-case contracts are declared for the next tasks." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Routing gateway method names.** The contract names the 16 operations by their R348 numbers only; this task keeps the old method names of the bundle and the app gateway (`getTargetReview`, `getReview`, `listStepCandidates`, `listReviewStepCandidates`, `getStepRun`, `listReviews`, `requestReview`, `startStep`, `takeOverStep`, `reassignStep`, `approveStep`, `rejectStep`, `cancelReview`, `restartStep`, `cancelForDelete`, `listBlockingReviews`). Tasks 8 and 9 use the same names on `ReviewRepository`.
- **Parameter passing.** R347 says "built field by field without the routing field". For the five operations whose `Params` is the wire type itself (the routing key is part of the wire object: `target.namespace` or `namespace`), the routing gateway passes `params` as is; building a copy would only repeat the same fields. The routing tests assert the exact object with `toStrictEqual` either way.
- **`ListReviewsUseCase` and `ReviewListPage`.** `ReviewListPage` still lives in `IReviewListUseCases.ts` in this task; `listReviews/abstractions.ts` imports it from there and Task 8 repoints it to `[AWR]/domain/ReviewListPage.ts`.
- **"Built during the render" check (R362).** The index tests register the other app's stub with `container.registerFactory(ReviewAppGateway, ...)`; the factory runs exactly when the routing gateway collects the app gateways (`resolveMultiple` calls factories on every multi-resolve), so recording the phase proves no routing gateway was built during the render. `resolveMultiple` lists instance registrations first, then class registrations, then factories (`node_modules/@webiny/di/dist/index.js:216-236`), so "first registered" (A114) means first within that order; with the disjoint claims (A115) the order never decides a real call.
- **Shared test fake.** `createFakeReviewAppGateway` (`[AWRT]/fakeReviewAppGateway.ts`) is a fake of the app gateway contract, not of a use-case bundle; it is the "fake app gateways registered with `registerInstance` under the multi token" of R355, shared by the routing test and the two index tests instead of three copies.
- **Three-root test.** It builds on Task 6's editor three-root test in `[WB]/index.test.tsx` (its imports of `CompositionProvider`, `WorkflowsAdminApp`, `CmsWorkflows` and its package-path module mocks of the two other roots' UI); it is a separate case for the review half, as R362 lets each half be asserted on its own.

## Review fixes (sub-phase review)

- Three-root test in `[WB]/index.test.tsx`: the `mockImplementation` callback typed its parameter with an inline object type (`{ query: string }`); it now takes `MainGraphQLClient.Request` and reads `request.query as string` (no inline object types).
- Checked without change: the DI subclass bridge (`createImplementation` writes metadata on the subclass only, `Reflect.getMetadata` finds the subclass's own entry first, and `CmsReviewRowProvider` is the in-repo precedent for extending a bound class), the `resolveMultiple` order (instances, classes, factories), every "before" hunk against HEAD (the importer `sed` runs before the four named-interface hunks), the fixture fields used by the tests, and the index-test anchors left by Task 6.
