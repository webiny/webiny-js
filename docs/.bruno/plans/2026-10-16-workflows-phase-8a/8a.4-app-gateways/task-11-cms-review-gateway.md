### Task 11: CMS gateway, registration, content adapter (`app-headless-cms-workflows`)

R202, R211, R222, R224, R204 (the envelope, not the throw); A77, A80, A83; D159; Q1, Q11, Q13 (`../00-answers.md`); Review Focus 1, 8, 17. The CMS package owns only what differs from Website Builder: the GraphQL operation documents over the `cms { ... }` root, the gateway that runs them (`CmsReviewGateway`), the registration that binds that gateway to the **shared** `ReviewUseCases` under CMS-only tokens, and the content adapter (R224). No review logic lives here: the gateway maps arguments (`modelId` from the namespace, `entryId`) and unwraps its own root field into the shared envelope, nothing else. It never throws for an envelope error (it returns `{ data, error }`, the shared use cases throw `GraphQLOperationError`, R202); a transport `Error` and a non-CMS namespace propagate as plain `Error`s.

- **Documents** (`graphql/<operation>.ts`, one exported UPPER_SNAKE const per file, each over the matching `CmsQuery`/`CmsMutation` field of `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`): `listCmsEntryWorkflows` (`LIST_CMS_ENTRY_WORKFLOWS`), `getCmsEntryTargetReview(modelId, revisionId)`, `getCmsEntryReview(id)`, `listCmsEntryReviews(list, where, sort, limit, after)`, `listCmsEntryStepCandidates(workflowId, stepId, modelId, revisionId)`, `listCmsEntryReviewStepCandidates(reviewId, stepId)`, `requestCmsEntryReview(modelId, revisionId, title, picks)`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep(reviewId, stepId, notifyPreviousOwner)`, `reassignCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep`, `cancelCmsEntryReview`, `cancelCmsEntryReviewsForDelete(modelId, entryId, revisionId, action)`. Selections come from the shared fragments of `app-workflows` (`REVIEW_FIELDS`, `REVIEW_WITH_FLAGS_FIELDS` for the list, `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS` for the two single reads `getCmsEntryTargetReview` and `getCmsEntryReview` (the assignment log, D89, is single-read only), `WORKFLOW_FIELDS`, `STEP_CANDIDATE_FIELDS`, `ERROR_FIELDS`, Task 8), so `candidateTeams { id name }` (Task 1) arrives through them. The list document adds `meta { cursor hasMoreItems }` (the `WorkflowsListMeta` type has no `totalCount`).
- **Gateway** (`CmsReviewGatewayImpl`, dependency `MainGraphQLClient`, exported as `CmsReviewGateway`): one method per `IReviewGateway` method. The only logic: `modelId = parseAppName(target.namespace)` (it throws a plain `Error` for a non-CMS namespace, before any request) and `return response.cms.<operation>`. `where` and `sort` of `listReviews` are passed through unchanged (`where.modelId` is the CMS content-type filter, D113; `reviewState`/`stepState` only arrive for My requests, R229). `cancelForDelete` sends `entryId = targetId` and `revisionId = targetRevisionId` (`null` for a whole-entry cancel, which the server treats as every revision).
- **Registration:** `CmsReviewGateway`, `CmsReviewUseCases` and `CmsReviewContentAdapter` tokens live each in its own file named after the token (`CmsReviewGateway.ts, CmsReviewUseCases.ts, CmsReviewContentAdapter.ts`); `CmsReviewFeature` registers the three as singletons (so the CMS use cases hold their own workflow-list cache, A74, A83). `CmsWorkflows` registers it first inside the flag gate (A77; the shared features come from `WorkflowsAdminApp`, mounted before it, and the registration itself needs nothing from them).
- **Adapter** (R224): `canHandle` is `isCmsAppName`; `getContentUrl` is the path of `Routes.ContentEntries.List` (`/cms/content-entries/:modelId`) with `:modelId` replaced and `?id=` plus the encoded revision id (the `#` becomes `%23`), no hooks; `getContentTypeLabel` reads the model name from the admin's `ModelsCache` (A80; `null` for an unknown or not yet loaded model).

**Files:**
- Create: `packages/app-headless-cms-workflows/vitest.config.ts`
- Modify: `packages/app-headless-cms-workflows/package.json` (devDependencies for the tests, R222)
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway.ts` (token, one abstraction per file)
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases.ts` (token, one abstraction per file)
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapter.ts` (token, one abstraction per file)
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCasesImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/graphql/CmsOperationResponse.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/graphql/{listCmsEntryWorkflows,getCmsEntryTargetReview,getCmsEntryReview,listCmsEntryReviews,listCmsEntryStepCandidates,listCmsEntryReviewStepCandidates,requestCmsEntryReview,startCmsEntryReviewStep,takeOverCmsEntryReviewStep,reassignCmsEntryReviewStep,approveCmsEntryReviewStep,rejectCmsEntryReviewStep,cancelCmsEntryReview,cancelCmsEntryReviewsForDelete}.ts` (14 files)
- Modify: `packages/app-headless-cms-workflows/src/index.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`
- Create: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Existing, must stay compiling: everything else in the package (the old components, presenters and editor views are untouched until Tasks 20, 21 and 37).

**Interfaces:**
- Consumes (Task 8, imported by deep path, R238): `IReviewGateway` and the parameter types (`ListStepCandidatesParams`, `ListReviewStepCandidatesParams`, `ReviewStepRef`, `RequestReviewParams`, `TakeOverReviewParams`, `ReassignReviewParams`, `ApproveReviewParams`, `RejectReviewParams`, `CancelReviewParams`, `ListReviewsParams`, `CancelForDeleteParams`) from `@webiny/app-workflows/review/gateway/IReviewGateway.js`; `ReviewDto`, `ReviewWithFlagsDto`, `WorkflowDto`, `StepCandidateDto`, `ReviewEnvelope`, `ReviewListEnvelope` from `.../review/gateway/dto.js`; `ReviewTarget` from `.../review/domain/types.js`; `ReviewState` (`.../review/domain/ReviewState.js`) and `StepState` (`.../review/domain/StepState.js`) in tests; `REVIEW_FIELDS`, `REVIEW_WITH_FLAGS_FIELDS`, `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS`, `WORKFLOW_FIELDS`, `STEP_CANDIDATE_FIELDS`, `ERROR_FIELDS` from `.../review/gateway/reviewFields.js`; `IReviewUseCases` (`.../review/useCases/IReviewUseCases.js`); `IReviewContentAdapter` and `ReviewContentRef` (`.../review/content/IReviewContentAdapter.js`). Task 9: `ReviewUseCases` (`.../review/useCases/ReviewUseCases.js`, a public, non-final class with constructor `(gateway: IReviewGateway)`) and `GraphQLOperationError` (`@webiny/app/errors/index.js`, Task 6, asserted in the feature test). Task 1: `candidateTeams` (selected by the shared fragments).
- Consumes (existing code, verified): `MainGraphQLClient` (`packages/app/src/features/mainGraphQLClient/abstractions.ts`, `execute<TResult, TVariables>({ query, variables })`); `parseAppName`, `isCmsAppName` (`packages/app-headless-cms-workflows/src/utils/appName.ts`); `Routes.ContentEntries.List` (`packages/app-headless-cms/src/routes.ts`, path `/cms/content-entries/:modelId`; `Route.path` getter in `packages/app/src/features/router/Route.ts`); `ModelsCache` (`packages/app-headless-cms/src/features/model/abstractions.ts`, an `IListCache<CmsModel>` registered by `ModelFeature` in `HeadlessCMS.tsx`; `getItem(predicate)` is synchronous); `createAbstraction`, `createFeature` (`@webiny/feature/admin`); `RegisterFeature`, `useFeatureFlags` (`@webiny/app-admin`); `DiContainerProvider` (`packages/app/src/shared/di/DiContainerProvider.tsx`); `FeatureFlagsService` (`packages/app-admin/src/features/featureFlags/abstractions.ts`); `FeatureFlags` (`@webiny/feature-flags`); `Container` (`@webiny/di`); the server operations of `CmsWorkflowsSchemaFactory.ts` (argument names and types above, verified).
- Produces (consumed by Tasks 20, 29, 35): `CmsReviewGateway = createAbstraction<IReviewGateway>("Cms/Workflows/ReviewGateway")`, `CmsReviewUseCases = createAbstraction<IReviewUseCases>("Cms/Workflows/ReviewUseCases")`, `CmsReviewContentAdapter = createAbstraction<IReviewContentAdapter>("Cms/Workflows/ReviewContentAdapter")` (each with a namespace `Interface`) each in its own file named after the token (`CmsReviewGateway.ts, CmsReviewUseCases.ts, CmsReviewContentAdapter.ts`); `CmsReviewGatewayImpl` exported as the implementation `CmsReviewGateway` (`CmsReviewGatewayImpl.ts`); the implementation `CmsReviewUseCases` (`CmsReviewUseCasesImpl.ts`, the one-line subclass `CmsReviewUseCasesImpl extends ReviewUseCases`, R237); `CmsReviewContentAdapterImpl` exported as the implementation `CmsReviewContentAdapter` (`CmsReviewContentAdapterImpl.ts`); `CmsReviewFeature` (`feature.ts`, name `"CmsWorkflows/Review"`, `resolve` -> `{ useCases: IReviewUseCases; contentAdapter: IReviewContentAdapter }`).

- [ ] **Step 1: Write the failing tests**

First the test setup of the package (R222, A75). Create `packages/app-headless-cms-workflows/vitest.config.ts` (a copy of `packages/app-admin/vitest.config.ts`):

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true
        }
    });
};
```

Modify `packages/app-headless-cms-workflows/package.json`, `devDependencies` (admin packages run `yarn test` only; there is no OpenSearch variant for a client package):

```json
  "devDependencies": {
    "@testing-library/react": "^16.3.2",
    "@types/react": "18.3.31",
    "@webiny/build-tools": "0.0.0",
    "@webiny/di": "^1.1.0",
    "@webiny/feature-flags": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "^7.0.2",
    "vitest": "^4.1.11"
  },
```

```bash
yarn > /dev/null 2>&1
```

Create `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { CmsReviewGateway as GatewayAbstraction } from "./CmsReviewGateway.js";
import { CmsReviewGateway } from "./CmsReviewGatewayImpl.js";

describe("CmsReviewGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(CmsReviewGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("lists the CMS workflows without variables", async () => {
        const envelope = { data: [{ id: "workflow-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryWorkflows: envelope } });

        const result = await gateway.listWorkflows();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listCmsEntryWorkflows");
        expect(request.query).toContain(WORKFLOW_FIELDS);
    });

    it("reads the target review by model id and revision id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryTargetReview: envelope } });

        const result = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ modelId: "article", revisionId: "entry-1#0001" });
        expect(request.query).toContain(
            "getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId)"
        );
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("returns an empty target review as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryTargetReview: envelope } });

        const result = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("rejects a non-CMS namespace before sending a request", async () => {
        await expect(
            gateway.getTargetReview({ namespace: "wb.page", targetRevisionId: "page-1#0001" })
        ).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(
            gateway.requestReview({
                target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
                title: "Review",
                picks: []
            })
        ).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(
            gateway.listStepCandidates({
                workflowId: "workflow-1",
                stepId: "step-1",
                target: { namespace: "wb.page", targetRevisionId: "page-1#0001" }
            })
        ).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(
            gateway.cancelForDelete({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: null,
                action: "trash"
            })
        ).rejects.toThrow('Invalid app name: "wb.page".');

        expect(client.execute).not.toHaveBeenCalled();
    });

    it("reads one review by id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReview: envelope } });

        const result = await gateway.getReview("review-1");

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "review-1" });
        expect(request.query).toContain("getCmsEntryReview(id: $id)");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("lists reviews with the content type and the My requests filters passed through", async () => {
        const envelope = {
            data: [{ review: { id: "review-1" }, flags: {} }],
            meta: { cursor: "cursor-2", hasMoreItems: true },
            error: null
        };
        client.execute.mockResolvedValue({ cms: { listCmsEntryReviews: envelope } });

        const result = await gateway.listReviews({
            list: "myRequests",
            where: {
                modelId: "article",
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            list: "myRequests",
            where: {
                modelId: "article",
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });
        expect(request.query).toContain("listCmsEntryReviews(");
        expect(request.query).toContain("meta");
        expect(request.query).toContain("hasMoreItems");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_FIELDS);
    });

    it("lists the candidates of a step before a review exists", async () => {
        const envelope = { data: [{ id: "user-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryStepCandidates: envelope } });

        const result = await gateway.listStepCandidates({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" }
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            workflowId: "workflow-1",
            stepId: "step-1",
            modelId: "article",
            revisionId: "entry-1#0001"
        });
        expect(request.query).toContain("listCmsEntryStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("lists who a step of a review can be reassigned to", async () => {
        const envelope = { data: [{ id: "user-2" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryReviewStepCandidates: envelope } });

        const result = await gateway.listReviewStepCandidates({
            reviewId: "review-1",
            stepId: "step-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("listCmsEntryReviewStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("requests a review with the title and the picks", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { requestCmsEntryReview: envelope } });

        const result = await gateway.requestReview({
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001",
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });
        expect(request.query).toContain("requestCmsEntryReview(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("starts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { startCmsEntryReviewStep: envelope } });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("startCmsEntryReviewStep(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("takes a step over and passes the notify choice", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { takeOverCmsEntryReviewStep: envelope } });

        const result = await gateway.takeOverStep({
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });
        expect(request.query).toContain("takeOverCmsEntryReviewStep(");
    });

    it("reassigns a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { reassignCmsEntryReviewStep: envelope } });

        const result = await gateway.reassignStep({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-2"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-2"
        });
        expect(request.query).toContain("reassignCmsEntryReviewStep(");
    });

    it("approves a step with and without a comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { approveCmsEntryReviewStep: envelope } });

        await gateway.approveStep({ reviewId: "review-1", stepId: "step-1", comment: "Looks good" });
        const result = await gateway.approveStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });

        expect(result).toEqual(envelope);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Looks good"
        });
        expect(client.execute.mock.calls[1][0].variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });
        expect(client.execute.mock.calls[0][0].query).toContain("approveCmsEntryReviewStep(");
    });

    it("rejects a step with the comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { rejectCmsEntryReviewStep: envelope } });

        const result = await gateway.rejectStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The headline needs work."
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The headline needs work."
        });
        expect(request.query).toContain("rejectCmsEntryReviewStep(");
    });

    it("cancels a review", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReview: envelope } });

        const result = await gateway.cancelReview({ reviewId: "review-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1" });
        expect(request.query).toContain("cancelCmsEntryReview(reviewId: $reviewId)");
    });

    it("cancels the reviews of a revision before a delete", async () => {
        const envelope = { data: [{ id: "review-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReviewsForDelete: envelope } });

        const result = await gateway.cancelForDelete({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            entryId: "entry-1",
            revisionId: "entry-1#0002",
            action: "delete"
        });
        expect(request.query).toContain("cancelCmsEntryReviewsForDelete(");
    });

    it("cancels every review of an entry when no revision is given", async () => {
        const envelope = { data: [], error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReviewsForDelete: envelope } });

        await gateway.cancelForDelete({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });

        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            entryId: "entry-1",
            revisionId: null,
            action: "trash"
        });
    });

    it("returns an envelope error as is and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/StepNotCurrent", message: "Not current.", data: null }
        };
        client.execute.mockResolvedValue({ cms: { startCmsEntryReviewStep: envelope } });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("lets a transport error pass through", async () => {
        client.execute.mockRejectedValue(new Error("Network down."));

        await expect(gateway.getReview("review-1")).rejects.toThrow("Network down.");
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapterImpl.js";

describe("CmsReviewContentAdapter", () => {
    const cache = new ListCache<CmsModel>("modelId");
    let adapter: AdapterAbstraction.Interface;

    beforeEach(() => {
        const article = { modelId: "article", name: "Article" } as CmsModel;
        cache.setItems([article]);

        const container = new Container();
        container.registerInstance(ModelsCache, cache);
        container.register(CmsReviewContentAdapter);
        adapter = container.resolve(AdapterAbstraction);
    });

    it("handles CMS namespaces only", () => {
        expect(adapter.canHandle("cms.article")).toBe(true);
        expect(adapter.canHandle("wb.page")).toBe(false);
        expect(adapter.canHandle("cms")).toBe(false);
        expect(adapter.canHandle("cms.article.extra")).toBe(false);
    });

    it("builds the entry URL from the content entries route with the revision id encoded", () => {
        const url = adapter.getContentUrl({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            contentTypeId: "article"
        });

        expect(url).toBe("/cms/content-entries/article?id=entry-1%230001");
    });

    it("throws for a namespace that is not a CMS one", () => {
        expect(() => {
            adapter.getContentUrl({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                contentTypeId: null
            });
        }).toThrow('Invalid app name: "wb.page".');
    });

    it("labels a content type with the model name", () => {
        expect(adapter.getContentTypeLabel("article")).toBe("Article");
    });

    it("returns null for an unknown or not yet loaded model", () => {
        expect(adapter.getContentTypeLabel("product")).toBeNull();

        cache.clear();

        expect(adapter.getContentTypeLabel("article")).toBeNull();
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";
import { CmsReviewGateway } from "./CmsReviewGateway.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases.js";
import { CmsReviewFeature } from "./feature.js";

describe("CmsReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));
        CmsReviewFeature.register(container);
    });

    it("registers the gateway, the use cases and the adapter under the CMS tokens", () => {
        const { useCases, contentAdapter } = CmsReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        expect(container.resolve(CmsReviewGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(CmsReviewGateway)).toBe(container.resolve(CmsReviewGateway));
        expect(container.resolve(CmsReviewUseCases)).toBe(container.resolve(CmsReviewUseCases));
        expect(container.resolve(CmsReviewContentAdapter)).toBe(
            container.resolve(CmsReviewContentAdapter)
        );
    });

    it("runs the shared use cases over the CMS gateway", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryTargetReview: { data: null, error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const result = await useCases.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001"
        });
    });

    it("turns an envelope error into a GraphQLOperationError in the shared use cases", async () => {
        client.execute.mockResolvedValue({
            cms: {
                getCmsEntryReview: {
                    data: null,
                    error: { code: "Workflows/Review/NotFound", message: "No review.", data: null }
                }
            }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const promise = useCases.getReview("review-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: "Workflows/Review/NotFound" });
    });

    it("caches the workflow list per instance, so the CMS use cases load it once", async () => {
        client.execute.mockResolvedValue({
            cms: { listCmsEntryWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const first = await useCases.getBoundWorkflow("cms.article");
        const second = await useCases.getBoundWorkflow("cms.article");

        expect(first).toBeNull();
        expect(second).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-headless-cms-workflows/src/index.test.tsx` (the composition test; the old children of the root are replaced by stubs because Tasks 20, 21 and 37 replace them, so this test pins only what Task 11 adds; A77: `CmsReviewFeature` needs nothing from the shared features at registration, so mounting `CmsWorkflows` alone is enough):

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflows } from "./index.js";

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
});

vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryFormScheduleMenuItemAction: () => null,
        CmsEntryFormTooltipButton: () => null,
        ContentEntryFormWorkflow: () => null
    };
});

vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
});

vi.mock("~/Components/OptionItem/OpenInNewWindow.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js", () => {
    return { CmsEntryFormCreateNewRevisionButton: () => null };
});

vi.mock("~/presentation/feature.js", () => {
    return {
        CmsWorkflowsFeature: { name: "Mock", register: () => undefined, resolve: () => undefined }
    };
});

vi.mock("~/features/feature.js", () => {
    return {
        CmsWorkflowsCacheFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

describe("CmsWorkflows composition", () => {
    const createContainer = (isEnabled: boolean): Container => {
        const flagsService: FeatureFlagsService.Interface = {
            getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        return container;
    };

    it("registers the CMS review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsReviewUseCases)).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsReviewUseCases)).toThrow("No registration found");
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

One file per command (admin package, `yarn test` only: a client package has no OpenSearch variant):

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: all four FAIL at import resolution (`./CmsReviewGateway.js`, `./CmsReviewGatewayImpl.js`, `./CmsReviewContentAdapter.js`, `./CmsReviewContentAdapterImpl.js`, `./feature.js`, `~/features/gateway/CmsReviewUseCases.js` do not exist). Record RED before writing source. If the run reports `No test files found`, the `vitest.config.ts` was not picked up: check its location and that `yarn` ran (A75, Task 8 verified the same setup in `app-workflows`).

- [ ] **Step 3: Implement**

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewGateway } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";

export const CmsReviewGateway = createAbstraction<IReviewGateway>("Cms/Workflows/ReviewGateway");

export namespace CmsReviewGateway {
    export type Interface = IReviewGateway;
}
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";

export const CmsReviewUseCases = createAbstraction<IReviewUseCases>("Cms/Workflows/ReviewUseCases");

export namespace CmsReviewUseCases {
    export type Interface = IReviewUseCases;
}
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapter.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";

export const CmsReviewContentAdapter = createAbstraction<IReviewContentAdapter>("Cms/Workflows/ReviewContentAdapter");

export namespace CmsReviewContentAdapter {
    export type Interface = IReviewContentAdapter;
}
```

`packages/app-headless-cms-workflows/src/features/gateway/graphql/CmsOperationResponse.ts`:

```ts
/**
 * The response of one operation under the `cms` root: the root field name maps to the envelope
 * the shared gateway interface returns.
 */
export interface CmsOperationResponse<TName extends string, TEnvelope> {
    cms: Record<TName, TEnvelope>;
}
```

The 14 documents, one per file under `packages/app-headless-cms-workflows/src/features/gateway/graphql/`.

`listCmsEntryWorkflows.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_WORKFLOWS = /* GraphQL */ `
    query ListCmsEntryWorkflows {
        cms {
            listCmsEntryWorkflows {
                data {
                    ${WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`getCmsEntryTargetReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_TARGET_REVIEW = /* GraphQL */ `
    query GetCmsEntryTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data {
                    ${REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`getCmsEntryReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_REVIEW = /* GraphQL */ `
    query GetCmsEntryReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    ${REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`listCmsEntryReviews.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_REVIEWS = /* GraphQL */ `
    query ListCmsEntryReviews(
        $list: WorkflowsReviewListKind!
        $where: WorkflowsReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        cms {
            listCmsEntryReviews(
                list: $list
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    ${REVIEW_WITH_FLAGS_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`listCmsEntryStepCandidates.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_STEP_CANDIDATES = /* GraphQL */ `
    query ListCmsEntryStepCandidates(
        $workflowId: ID!
        $stepId: ID!
        $modelId: ID!
        $revisionId: ID!
    ) {
        cms {
            listCmsEntryStepCandidates(
                workflowId: $workflowId
                stepId: $stepId
                modelId: $modelId
                revisionId: $revisionId
            ) {
                data {
                    ${STEP_CANDIDATE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`listCmsEntryReviewStepCandidates.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListCmsEntryReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        cms {
            listCmsEntryReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
                data {
                    ${STEP_CANDIDATE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`requestCmsEntryReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REQUEST_CMS_ENTRY_REVIEW = /* GraphQL */ `
    mutation RequestCmsEntryReview(
        $modelId: ID!
        $revisionId: ID!
        $title: String
        $picks: [WorkflowsReviewPickInput!]
    ) {
        cms {
            requestCmsEntryReview(
                modelId: $modelId
                revisionId: $revisionId
                title: $title
                picks: $picks
            ) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`startCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const START_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation StartCmsEntryReviewStep($reviewId: ID!, $stepId: ID!) {
        cms {
            startCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`takeOverCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const TAKE_OVER_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation TakeOverCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $notifyPreviousOwner: Boolean) {
        cms {
            takeOverCmsEntryReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
            ) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`reassignCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REASSIGN_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation ReassignCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        cms {
            reassignCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, userId: $userId) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`approveCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const APPROVE_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation ApproveCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            approveCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`rejectCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REJECT_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation RejectCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            rejectCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`cancelCmsEntryReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_CMS_ENTRY_REVIEW = /* GraphQL */ `
    mutation CancelCmsEntryReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`cancelCmsEntryReviewsForDelete.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelCmsEntryReviewsForDelete(
        $modelId: ID!
        $entryId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        cms {
            cancelCmsEntryReviewsForDelete(
                modelId: $modelId
                entryId: $entryId
                revisionId: $revisionId
                action: $action
            ) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { ReviewTarget } from "@webiny/app-workflows/review/domain/types.js";
import type { ReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewListEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { StepCandidateDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { WorkflowDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ApproveReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { parseAppName } from "~/utils/appName.js";
import { CmsReviewGateway as GatewayAbstraction } from "./CmsReviewGateway.js";
import type { CmsOperationResponse } from "./graphql/CmsOperationResponse.js";
import { APPROVE_CMS_ENTRY_REVIEW_STEP } from "./graphql/approveCmsEntryReviewStep.js";
import { CANCEL_CMS_ENTRY_REVIEW } from "./graphql/cancelCmsEntryReview.js";
import { CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE } from "./graphql/cancelCmsEntryReviewsForDelete.js";
import { GET_CMS_ENTRY_REVIEW } from "./graphql/getCmsEntryReview.js";
import { GET_CMS_ENTRY_TARGET_REVIEW } from "./graphql/getCmsEntryTargetReview.js";
import { LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES } from "./graphql/listCmsEntryReviewStepCandidates.js";
import { LIST_CMS_ENTRY_REVIEWS } from "./graphql/listCmsEntryReviews.js";
import { LIST_CMS_ENTRY_STEP_CANDIDATES } from "./graphql/listCmsEntryStepCandidates.js";
import { LIST_CMS_ENTRY_WORKFLOWS } from "./graphql/listCmsEntryWorkflows.js";
import { REASSIGN_CMS_ENTRY_REVIEW_STEP } from "./graphql/reassignCmsEntryReviewStep.js";
import { REJECT_CMS_ENTRY_REVIEW_STEP } from "./graphql/rejectCmsEntryReviewStep.js";
import { REQUEST_CMS_ENTRY_REVIEW } from "./graphql/requestCmsEntryReview.js";
import { START_CMS_ENTRY_REVIEW_STEP } from "./graphql/startCmsEntryReviewStep.js";
import { TAKE_OVER_CMS_ENTRY_REVIEW_STEP } from "./graphql/takeOverCmsEntryReviewStep.js";

class CmsReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryWorkflows", ReviewEnvelope<WorkflowDto[]>>
        >({
            query: LIST_CMS_ENTRY_WORKFLOWS
        });

        return response.cms.listCmsEntryWorkflows;
    }

    async getTargetReview(target: ReviewTarget): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>> {
        const modelId = parseAppName(target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<
                "getCmsEntryTargetReview",
                ReviewEnvelope<ReviewWithFlagsDto | null>
            >
        >({
            query: GET_CMS_ENTRY_TARGET_REVIEW,
            variables: { modelId, revisionId: target.targetRevisionId }
        });

        return response.cms.getCmsEntryTargetReview;
    }

    async getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"getCmsEntryReview", ReviewEnvelope<ReviewWithFlagsDto>>
        >({
            query: GET_CMS_ENTRY_REVIEW,
            variables: { id: reviewId }
        });

        return response.cms.getCmsEntryReview;
    }

    async listStepCandidates(
        params: ListStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const modelId = parseAppName(params.target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryStepCandidates", ReviewEnvelope<StepCandidateDto[]>>
        >({
            query: LIST_CMS_ENTRY_STEP_CANDIDATES,
            variables: {
                workflowId: params.workflowId,
                stepId: params.stepId,
                modelId,
                revisionId: params.target.targetRevisionId
            }
        });

        return response.cms.listCmsEntryStepCandidates;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const response = await this.client.execute<
            CmsOperationResponse<
                "listCmsEntryReviewStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.listCmsEntryReviewStepCandidates;
    }

    async listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope> {
        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryReviews", ReviewListEnvelope>
        >({
            query: LIST_CMS_ENTRY_REVIEWS,
            variables: {
                list: params.list,
                where: params.where,
                sort: params.sort,
                limit: params.limit,
                after: params.after
            }
        });

        return response.cms.listCmsEntryReviews;
    }

    async requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const modelId = parseAppName(params.target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"requestCmsEntryReview", ReviewEnvelope<ReviewDto>>
        >({
            query: REQUEST_CMS_ENTRY_REVIEW,
            variables: {
                modelId,
                revisionId: params.target.targetRevisionId,
                title: params.title,
                picks: params.picks
            }
        });

        return response.cms.requestCmsEntryReview;
    }

    async startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"startCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: START_CMS_ENTRY_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.startCmsEntryReviewStep;
    }

    async takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"takeOverCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: TAKE_OVER_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                notifyPreviousOwner: params.notifyPreviousOwner
            }
        });

        return response.cms.takeOverCmsEntryReviewStep;
    }

    async reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"reassignCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REASSIGN_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                userId: params.userId
            }
        });

        return response.cms.reassignCmsEntryReviewStep;
    }

    async approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"approveCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: APPROVE_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.cms.approveCmsEntryReviewStep;
    }

    async rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"rejectCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REJECT_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.cms.rejectCmsEntryReviewStep;
    }

    async cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"cancelCmsEntryReview", ReviewEnvelope<ReviewDto>>
        >({
            query: CANCEL_CMS_ENTRY_REVIEW,
            variables: { reviewId: params.reviewId }
        });

        return response.cms.cancelCmsEntryReview;
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>> {
        const modelId = parseAppName(params.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"cancelCmsEntryReviewsForDelete", ReviewEnvelope<ReviewDto[]>>
        >({
            query: CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE,
            variables: {
                modelId,
                entryId: params.targetId,
                revisionId: params.targetRevisionId,
                action: params.action
            }
        });

        return response.cms.cancelCmsEntryReviewsForDelete;
    }
}

export const CmsReviewGateway = GatewayAbstraction.createImplementation({
    implementation: CmsReviewGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCasesImpl.ts` (the shared `ReviewUseCases` bound under the CMS token; the subclass is required, R237):

```ts
import { ReviewUseCases } from "@webiny/app-workflows/review/useCases/ReviewUseCases.js";
import { CmsReviewGateway } from "./CmsReviewGateway.js";
import { CmsReviewUseCases as UseCasesAbstraction } from "./CmsReviewUseCases.js";

/**
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `ReviewUseCases`, so each app binds its own subclass;
 * binding the shared class twice would let the second call overwrite the first.
 */
class CmsReviewUseCasesImpl extends ReviewUseCases implements UseCasesAbstraction.Interface {}

export const CmsReviewUseCases = UseCasesAbstraction.createImplementation({
    implementation: CmsReviewUseCasesImpl,
    dependencies: [CmsReviewGateway]
});
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.ts`:

```ts
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { Routes } from "@webiny/app-headless-cms/routes.js";
import type { ReviewContentRef } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { isCmsAppName } from "~/utils/appName.js";
import { parseAppName } from "~/utils/appName.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter.js";

class CmsReviewContentAdapterImpl implements AdapterAbstraction.Interface {
    constructor(private modelsCache: ModelsCache.Interface) {}

    canHandle(namespace: string): boolean {
        return isCmsAppName(namespace);
    }

    getContentUrl(ref: ReviewContentRef): string {
        const modelId = parseAppName(ref.namespace);
        const encodedModelId = encodeURIComponent(modelId);
        const encodedRevisionId = encodeURIComponent(ref.targetRevisionId);
        const path = Routes.ContentEntries.List.path.replace(":modelId", encodedModelId);

        return `${path}?id=${encodedRevisionId}`;
    }

    getContentTypeLabel(contentTypeId: string): string | null {
        const model = this.modelsCache.getItem(item => item.modelId === contentTypeId);

        if (!model) {
            return null;
        }

        return model.name;
    }
}

export const CmsReviewContentAdapter = AdapterAbstraction.createImplementation({
    implementation: CmsReviewContentAdapterImpl,
    dependencies: [ModelsCache]
});
```

`packages/app-headless-cms-workflows/src/features/gateway/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter.js";
import { CmsReviewUseCases as UseCasesAbstraction } from "./CmsReviewUseCases.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapterImpl.js";
import { CmsReviewGateway } from "./CmsReviewGatewayImpl.js";
import { CmsReviewUseCases } from "./CmsReviewUseCasesImpl.js";

export const CmsReviewFeature = createFeature({
    name: "CmsWorkflows/Review",
    register(container) {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
        container.register(CmsReviewContentAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction)
        };
    }
});
```

Modify `packages/app-headless-cms-workflows/src/index.tsx`. Add the import after the existing `CmsWorkflowsEditorPresenterFeature` import:

```tsx
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";
```

and register it first inside the gate (shared features are already registered by `WorkflowsAdminApp`, A77):

```tsx
    return (
        <>
            <RegisterFeature feature={CmsReviewFeature} />
            <RegisterFeature feature={CmsWorkflowsFeature} />
            <RegisterFeature feature={CmsWorkflowsCacheFeature} />
            <RegisterFeature feature={CmsWorkflowsEditorPresenterFeature} />
```

Everything else in `index.tsx` stays (Tasks 20, 21 and 37 replace the old registrations).

- [ ] **Step 4: Run the new tests to see them pass**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: PASS. If the composition test cannot load `@webiny/app-admin` (the root imports its barrel; the adapter imports it through `Routes`), say so in the commit and mock only the failing module; do not drop the flag-off assertion.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

`CmsWorkflows` is the only existing file changed, and the package had no tests before this task, so the check is the type check of the package, which is its build (the package has no `__tests__/**/*.test.ts`, so `check:test:types` does not list it; the build type-checks the co-located tests, R243):

```bash
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Expected: no type errors. Resolve any mismatch against the final Task 8 types (the parameter and DTO names are the contract's) by correcting this task's code, not the shared types.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (the new devDependencies change `yarn.lock` and the generated `tsconfig` files; `yarn adio` must report no missing or unused dependency, add what it names), build the changed package with `--no-cache`, and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-headless-cms-workflows): add the CMS review gateway, registration and content adapter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes**

- **The adapter resolves only inside an admin container that has `HeadlessCMS` mounted** (it depends on `ModelsCache`, A80), and `getContentTypeLabel` returns `null` until `ListModelsUseCase` has filled the cache; Task 29 runs it before rows render.
- **Composition test and A77.** `src/index.test.tsx` mounts `CmsWorkflows` alone with the old children stubbed (Tasks 20, 21, 29 and 37 replace the stubs in the same commits that replace the children); it does not mount `WorkflowsAdminApp` because `CmsReviewFeature` needs nothing from the shared features at registration (its dependencies resolve lazily). The order guarantee of A77 stays an app-level fact (`Admin.tsx`).
- **Size:** large (14 documents, a 14-method gateway, adapter, feature, root change and 4 test files), but mechanical, one test cycle and one review gate.
