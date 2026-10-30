### Task 12: WB gateway, registration, content adapter (`app-website-builder-workflows`)

R202, R211, R222, R224, R204 (the envelope, not the throw), R227 (WB specifics); A77, A83; D159; Q1, Q11, Q13 (`../00-answers.md`); Review Focus 1, 8, 17. The Website Builder package owns only what differs from the CMS: the GraphQL operation documents over the `websiteBuilder { ... }` root, the gateway that runs them (`WbReviewGateway`), the registration that binds that gateway to the **shared** `ReviewUseCases` under WB-only tokens, and the content adapter (R224). No review logic lives here: the gateway maps arguments (a page has no model, `revisionId` instead of `modelId` + `entryId`, `pageId` for the delete cancel) and unwraps its own root field into the shared envelope, nothing else. It never throws for an envelope error (it returns `{ data, error }`, the shared use cases throw `GraphQLOperationError`, R202); a transport `Error` and a namespace other than `wb.page` propagate as plain `Error`s.

- **Documents** (`graphql/<operation>.ts`, one exported UPPER_SNAKE const per file, each over the matching `WbQuery`/`WbMutation` field of `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`): `listWebsiteBuilderPageWorkflows`, `getWebsiteBuilderPageTargetReview(revisionId)`, `getWebsiteBuilderPageReview(id)`, `listWebsiteBuilderPageReviews(list, where, sort, limit, after)` (`where` is the `WbPageReviewListWhere` input: no `modelId`), `listWebsiteBuilderPageStepCandidates(workflowId, stepId, revisionId)`, `listWebsiteBuilderPageReviewStepCandidates(reviewId, stepId)`, `requestWebsiteBuilderPageReview(revisionId, title, picks)`, `startWebsiteBuilderPageReviewStep`, `takeOverWebsiteBuilderPageReviewStep(reviewId, stepId, notifyPreviousOwner)`, `reassignWebsiteBuilderPageReviewStep`, `approveWebsiteBuilderPageReviewStep`, `rejectWebsiteBuilderPageReviewStep`, `cancelWebsiteBuilderPageReview`, `cancelWebsiteBuilderPageReviewsForDelete(pageId, revisionId, action)` (the optional `revisionId` argument is added by Task 5). Selections come from the shared fragments of `app-workflows` (Task 8): `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS` for the two single reads, `REVIEW_WITH_FLAGS_FIELDS` for the list, `REVIEW_FIELDS` for the mutations, so `candidateTeams { id name }` (Task 1) arrives through them. The list document adds `meta { cursor hasMoreItems }`.
- **Gateway** (`WbReviewGatewayImpl`, dependency `MainGraphQLClient`, exported as `WbReviewGateway`): one method per `IReviewGateway` method. The only logic: the namespace check (a pure `assertWbPageNamespace`, a plain `Error` for anything but `WB_PAGE_APP`, before any request) on the four methods that receive a namespace (`getTargetReview`, `listStepCandidates`, `requestReview`, `cancelForDelete`), the argument mapping and `return response.websiteBuilder.<operation>`. `listReviews` passes `list`, `sort`, `limit`, `after` through and builds `where` from `titleContains`, `reviewState` and `stepState` only: **`modelId` is dropped** because the WB filter input has none (the content type filter is CMS-only, D113). `cancelForDelete` sends `pageId = targetId` and `revisionId = targetRevisionId` (`null` for a whole-page cancel, which the server treats as every revision, Task 5).
- **Registration:** `WbReviewGateway` (`"WebsiteBuilder/Workflows/ReviewGateway"`), `WbReviewUseCases` (`"WebsiteBuilder/Workflows/ReviewUseCases"`) and `WbReviewContentAdapter` (`"Wb/Workflows/ReviewContentAdapter"`) live each in its own file named after the token (`WbReviewGateway.ts, WbReviewUseCases.ts, WbReviewContentAdapter.ts`); `WbReviewFeature` registers the three as singletons (so the WB use cases hold their own workflow-list cache, A74, A83). `WebsiteBuilderWorkflows` registers it first inside the flag gate (A77).
- **Adapter** (R224): `canHandle` is `namespace === WB_PAGE_APP`; `getContentUrl` is the path of `Routes.Pages.Editor` (`/website-builder/pages/editor/:id`) with `:id` replaced by the encoded revision id (the `#` becomes `%23`), no hooks; `getContentTypeLabel` returns `null` (a page has no content type).
- **A83 and Review Focus 1 are proven here**: with only the WB feature registered the CMS tokens are unresolved; with both apps' registrations in one container the two use-case instances are different objects with separate caches and each calls only its own document.

**Files:**
- Create: `packages/app-website-builder-workflows/vitest.config.ts`
- Modify: `packages/app-website-builder-workflows/package.json` (devDependencies for the tests, R222, and the CMS package for the coexistence test)
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway.ts` (token, one abstraction per file)
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCases.ts` (token, one abstraction per file)
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapter.ts` (token, one abstraction per file)
- Create: `packages/app-website-builder-workflows/src/features/gateway/assertWbPageNamespace.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCasesImpl.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/feature.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/graphql/WbOperationResponse.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/graphql/{listWebsiteBuilderPageWorkflows,getWebsiteBuilderPageTargetReview,getWebsiteBuilderPageReview,listWebsiteBuilderPageReviews,listWebsiteBuilderPageStepCandidates,listWebsiteBuilderPageReviewStepCandidates,requestWebsiteBuilderPageReview,startWebsiteBuilderPageReviewStep,takeOverWebsiteBuilderPageReviewStep,reassignWebsiteBuilderPageReviewStep,approveWebsiteBuilderPageReviewStep,rejectWebsiteBuilderPageReviewStep,cancelWebsiteBuilderPageReview,cancelWebsiteBuilderPageReviewsForDelete}.ts` (14 files)
- Modify: `packages/app-website-builder-workflows/src/index.tsx`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`
- Create: `packages/app-website-builder-workflows/src/index.test.tsx`
- Existing, must stay compiling: everything else in the package (the old components and hooks are untouched until Tasks 22-24 and 37).

**Interfaces:**
- Consumes (Task 8 and 9, imported by deep path, R238): `IReviewGateway` and the parameter types from `@webiny/app-workflows/review/gateway/IReviewGateway.js`; `ReviewDto`, `ReviewWithFlagsDto`, `WorkflowDto`, `StepCandidateDto`, `ReviewEnvelope`, `ReviewListEnvelope` from `.../review/gateway/dto.js`; `ReviewTarget` from `.../review/domain/types.js`; `ReviewState`, `StepState` in tests; `REVIEW_FIELDS`, `REVIEW_WITH_FLAGS_FIELDS`, `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS`, `WORKFLOW_FIELDS`, `STEP_CANDIDATE_FIELDS`, `ERROR_FIELDS` from `.../review/gateway/reviewFields.js`; `IReviewUseCases`; `IReviewContentAdapter` and `ReviewContentRef`; `ReviewUseCases` (a public, non-final class, constructor `(gateway: IReviewGateway)`); `GraphQLOperationError` (`@webiny/app/errors/index.js`, Task 6). Task 1: `candidateTeams`. Task 5: `cancelWebsiteBuilderPageReviewsForDelete(pageId, revisionId, action)`. Task 11: `CmsReviewGateway` and `CmsReviewUseCases` (implementations in `@webiny/app-headless-cms-workflows/features/gateway/CmsReviewGatewayImpl.js` and `.../CmsReviewUseCasesImpl.js`, tokens in `.../CmsReviewGateway.js` and `.../CmsReviewUseCases.js`), used only by the coexistence test.
- Consumes (existing code, verified): `MainGraphQLClient` (`packages/app/src/features/mainGraphQLClient/abstractions.ts`); `WB_PAGE_APP` (`packages/app-website-builder-workflows/src/constants.ts`, `"wb.page"`); `Routes.Pages.Editor` (`packages/app-website-builder/src/routes.ts`, path `/website-builder/pages/editor/:id`); `createAbstraction`, `createFeature` (`@webiny/feature/admin`); `RegisterFeature`, `useFeatureFlags` (`@webiny/app-admin`); `DiContainerProvider`; `FeatureFlagsService`; `FeatureFlags` (`@webiny/feature-flags`); `Container` (`@webiny/di`); the server operations of `WebsiteBuilderWorkflowsSchemaFactory.ts` (argument names and types above, verified).
- Produces (consumed by Tasks 22, 30, 36): `WbReviewGateway = createAbstraction<IReviewGateway>("WebsiteBuilder/Workflows/ReviewGateway")`, `WbReviewUseCases = createAbstraction<IReviewUseCases>("WebsiteBuilder/Workflows/ReviewUseCases")`, `WbReviewContentAdapter = createAbstraction<IReviewContentAdapter>("Wb/Workflows/ReviewContentAdapter")` (each with a namespace `Interface`) each in its own file named after the token (`WbReviewGateway.ts, WbReviewUseCases.ts, WbReviewContentAdapter.ts`); `WbReviewGatewayImpl` exported as the implementation `WbReviewGateway`; the implementation `WbReviewUseCases` (`WbReviewUseCasesImpl.ts`); `WbReviewContentAdapterImpl` exported as the implementation `WbReviewContentAdapter`; `WbReviewFeature` (`feature.ts`, name `"WebsiteBuilderWorkflows/Review"`, `resolve` -> `{ useCases: IReviewUseCases; contentAdapter: IReviewContentAdapter }`).

- [ ] **Step 1: Write the failing tests**

First the test setup of the package (R222, A75). Create `packages/app-website-builder-workflows/vitest.config.ts` (a copy of `packages/app-admin/vitest.config.ts`):

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

Modify `packages/app-website-builder-workflows/package.json`, `devDependencies` (admin packages run `yarn test` only: a client package has no OpenSearch variant; `@webiny/app-headless-cms-workflows` is a devDependency only for the coexistence test):

```json
  "devDependencies": {
    "@testing-library/react": "^16.3.2",
    "@types/react": "18.3.31",
    "@webiny/app-headless-cms-workflows": "0.0.0",
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

Create `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts`:

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
import { WbReviewGateway as GatewayAbstraction } from "./WbReviewGateway.js";
import { WbReviewGateway } from "./WbReviewGatewayImpl.js";

describe("WbReviewGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WbReviewGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("lists the page workflows without variables", async () => {
        const envelope = { data: [{ id: "workflow-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: envelope }
        });

        const result = await gateway.listWorkflows();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("websiteBuilder");
        expect(request.query).toContain("listWebsiteBuilderPageWorkflows");
        expect(request.query).toContain(WORKFLOW_FIELDS);
    });

    it("reads the target review by revision id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: envelope }
        });

        const result = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revisionId: "page-1#0001" });
        expect(request.query).toContain(
            "getWebsiteBuilderPageTargetReview(revisionId: $revisionId)"
        );
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("returns an empty target review as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: envelope }
        });

        const result = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("rejects a namespace other than wb.page before sending a request", async () => {
        const cmsTarget = { namespace: "cms.article", targetRevisionId: "entry-1#0001" };

        await expect(gateway.getTargetReview(cmsTarget)).rejects.toThrow(
            'Invalid app name: "cms.article".'
        );
        await expect(
            gateway.requestReview({ target: cmsTarget, title: "Review", picks: [] })
        ).rejects.toThrow('Invalid app name: "cms.article".');
        await expect(
            gateway.listStepCandidates({
                workflowId: "workflow-1",
                stepId: "step-1",
                target: cmsTarget
            })
        ).rejects.toThrow('Invalid app name: "cms.article".');
        await expect(
            gateway.cancelForDelete({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            })
        ).rejects.toThrow('Invalid app name: "cms.article".');

        expect(client.execute).not.toHaveBeenCalled();
    });

    it("reads one review by id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.getReview("review-1");

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "review-1" });
        expect(request.query).toContain("getWebsiteBuilderPageReview(id: $id)");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("lists reviews, passes the My requests filters and drops the content type filter", async () => {
        const envelope = {
            data: [{ review: { id: "review-1" }, flags: {} }],
            meta: { cursor: "cursor-2", hasMoreItems: true },
            error: null
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageReviews: envelope }
        });

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
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });
        expect(request.variables.where).not.toHaveProperty("modelId");
        expect(request.query).toContain("$where: WbPageReviewListWhere");
        expect(request.query).toContain("listWebsiteBuilderPageReviews(");
        expect(request.query).toContain("meta");
        expect(request.query).toContain("hasMoreItems");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_FIELDS);
    });

    it("lists the candidates of a step before a review exists", async () => {
        const envelope = { data: [{ id: "user-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageStepCandidates: envelope }
        });

        const result = await gateway.listStepCandidates({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" }
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            workflowId: "workflow-1",
            stepId: "step-1",
            revisionId: "page-1#0001"
        });
        expect(request.query).toContain("listWebsiteBuilderPageStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("lists who a step of a review can be reassigned to", async () => {
        const envelope = { data: [{ id: "user-2" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageReviewStepCandidates: envelope }
        });

        const result = await gateway.listReviewStepCandidates({
            reviewId: "review-1",
            stepId: "step-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("listWebsiteBuilderPageReviewStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("requests a review with the title and the picks", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { requestWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.requestReview({
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            title: "Launch page",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            revisionId: "page-1#0001",
            title: "Launch page",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });
        expect(request.query).toContain("requestWebsiteBuilderPageReview(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("starts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { startWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("startWebsiteBuilderPageReviewStep(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("takes a step over and passes the notify choice", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { takeOverWebsiteBuilderPageReviewStep: envelope }
        });

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
        expect(request.query).toContain("takeOverWebsiteBuilderPageReviewStep(");
    });

    it("reassigns a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { reassignWebsiteBuilderPageReviewStep: envelope }
        });

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
        expect(request.query).toContain("reassignWebsiteBuilderPageReviewStep(");
    });

    it("approves a step with and without a comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { approveWebsiteBuilderPageReviewStep: envelope }
        });

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
        expect(client.execute.mock.calls[0][0].query).toContain(
            "approveWebsiteBuilderPageReviewStep("
        );
    });

    it("rejects a step with the comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { rejectWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.rejectStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The hero image is wrong."
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The hero image is wrong."
        });
        expect(request.query).toContain("rejectWebsiteBuilderPageReviewStep(");
    });

    it("cancels a review", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.cancelReview({ reviewId: "review-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1" });
        expect(request.query).toContain("cancelWebsiteBuilderPageReview(reviewId: $reviewId)");
    });

    it("cancels the reviews of one page revision before a delete", async () => {
        const envelope = { data: [{ id: "review-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReviewsForDelete: envelope }
        });

        const result = await gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002",
            action: "delete"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            pageId: "page-1",
            revisionId: "page-1#0002",
            action: "delete"
        });
        expect(request.query).toContain("cancelWebsiteBuilderPageReviewsForDelete(");
    });

    it("cancels every review of a page when no revision is given", async () => {
        const envelope = { data: [], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReviewsForDelete: envelope }
        });

        await gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });

        expect(client.execute.mock.calls[0][0].variables).toEqual({
            pageId: "page-1",
            revisionId: null,
            action: "trash"
        });
    });

    it("returns an envelope error as is and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/StepNotCurrent", message: "Not current.", data: null }
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { startWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("lets a transport error pass through", async () => {
        client.execute.mockRejectedValue(new Error("Network down."));

        await expect(gateway.getReview("review-1")).rejects.toThrow("Network down.");
    });
});
```

Create `packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapterImpl.js";

describe("WbReviewContentAdapter", () => {
    let adapter: AdapterAbstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(WbReviewContentAdapter);
        adapter = container.resolve(AdapterAbstraction);
    });

    it("handles the wb.page namespace only", () => {
        expect(adapter.canHandle("wb.page")).toBe(true);
        expect(adapter.canHandle("cms.article")).toBe(false);
        expect(adapter.canHandle("wb")).toBe(false);
    });

    it("builds the page editor URL from the editor route with the revision id encoded", () => {
        const url = adapter.getContentUrl({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            contentTypeId: null
        });

        expect(url).toBe("/website-builder/pages/editor/page-1%230001");
    });

    it("throws for a namespace that is not wb.page", () => {
        expect(() => {
            adapter.getContentUrl({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                contentTypeId: "article"
            });
        }).toThrow('Invalid app name: "cms.article".');
    });

    it("has no content type label", () => {
        expect(adapter.getContentTypeLabel("page")).toBeNull();
    });
});
```

Create `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts` (the coexistence test, A83 and Review Focus 1):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsReviewUseCases as CmsReviewUseCasesAbstraction } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases.js";
import { CmsReviewGateway } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewGatewayImpl.js";
import { CmsReviewUseCases } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCasesImpl.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";
import { WbReviewGateway } from "./WbReviewGateway.js";
import { WbReviewUseCases } from "./WbReviewUseCases.js";
import { WbReviewFeature } from "./feature.js";

describe("WbReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbReviewFeature.register(container);
    });

    it("registers the gateway, the use cases and the adapter under the WB tokens", () => {
        const { useCases, contentAdapter } = WbReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        expect(container.resolve(WbReviewGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(WbReviewGateway)).toBe(container.resolve(WbReviewGateway));
        expect(container.resolve(WbReviewUseCases)).toBe(container.resolve(WbReviewUseCases));
        expect(container.resolve(WbReviewContentAdapter)).toBe(
            container.resolve(WbReviewContentAdapter)
        );
    });

    it("registers no CMS token: the other app's use cases are unresolved", () => {
        expect(() => container.resolve(CmsReviewUseCasesAbstraction)).toThrow(
            "No registration found"
        );
    });

    it("runs the shared use cases over the WB gateway", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: { data: null, error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const result = await useCases.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({ revisionId: "page-1#0001" });
    });

    it("turns an envelope error into a GraphQLOperationError in the shared use cases", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: {
                getWebsiteBuilderPageReview: {
                    data: null,
                    error: { code: "Workflows/Review/NotFound", message: "No review.", data: null }
                }
            }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const promise = useCases.getReview("review-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: "Workflows/Review/NotFound" });
    });

    it("keeps both apps' tokens in one container with separate instances and caches (A83)", async () => {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
        client.execute.mockImplementation(async (request: { query: string }) => {
            if (request.query.includes("listCmsEntryWorkflows")) {
                return { cms: { listCmsEntryWorkflows: { data: [], error: null } } };
            }

            return {
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            };
        });
        const wbUseCases = container.resolve(WbReviewUseCases);
        const cmsUseCases = container.resolve(CmsReviewUseCasesAbstraction);

        expect(wbUseCases).not.toBe(cmsUseCases);

        await wbUseCases.getBoundWorkflow("wb.page");
        await wbUseCases.getBoundWorkflow("wb.page");
        await cmsUseCases.getBoundWorkflow("cms.article");
        await cmsUseCases.getBoundWorkflow("cms.article");

        expect(client.execute).toHaveBeenCalledTimes(2);
        const queries = client.execute.mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("listWebsiteBuilderPageWorkflows"))).toHaveLength(1);
        expect(queries.filter(query => query.includes("listCmsEntryWorkflows"))).toHaveLength(1);
    });

    it("caches the workflow list per instance, so the WB use cases load it once", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const first = await useCases.getBoundWorkflow("wb.page");
        const second = await useCases.getBoundWorkflow("wb.page");

        expect(first).toBeNull();
        expect(second).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-website-builder-workflows/src/index.test.tsx` (the composition test; the old children of the root are replaced by stubs because Tasks 22-24 and 37 replace them, so this test pins only what Task 12 adds; A77: `WbReviewFeature` needs nothing from the shared features at registration):

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
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WebsiteBuilderWorkflows } from "./index.js";

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/index.js", () => {
    return {
        ListOpenInNewWindow: () => null,
        PageEditorConfig: () => null,
        PagesList: () => null
    };
});

vi.mock("~/presentation/page/PageList/feature.js", () => {
    return {
        PageListWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("~/presentation/page/PageGet/feature.js", () => {
    return {
        PageGetWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

describe("WebsiteBuilderWorkflows composition", () => {
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

    it("registers the WB review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbReviewUseCases)).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbReviewUseCases)).toThrow("No registration found");
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

One file per command (admin package, `yarn test` only):

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: all four FAIL at import resolution (`./WbReviewGateway.js`, `./WbReviewGatewayImpl.js`, `./WbReviewContentAdapterImpl.js`, `./feature.js`, `~/features/gateway/WbReviewUseCases.js` do not exist). Record RED before writing source. If the run reports `No test files found`, the `vitest.config.ts` was not picked up (A75).

- [ ] **Step 3: Implement**

`packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewGateway } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";

export const WbReviewGateway = createAbstraction<IReviewGateway>("WebsiteBuilder/Workflows/ReviewGateway");

export namespace WbReviewGateway {
    export type Interface = IReviewGateway;
}
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";

export const WbReviewUseCases = createAbstraction<IReviewUseCases>("WebsiteBuilder/Workflows/ReviewUseCases");

export namespace WbReviewUseCases {
    export type Interface = IReviewUseCases;
}
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapter.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";

export const WbReviewContentAdapter = createAbstraction<IReviewContentAdapter>("Wb/Workflows/ReviewContentAdapter");

export namespace WbReviewContentAdapter {
    export type Interface = IReviewContentAdapter;
}
```

`packages/app-website-builder-workflows/src/features/gateway/assertWbPageNamespace.ts` (a pure function, no dependency call; the message mirrors the CMS `parseAppName` error):

```ts
import { WB_PAGE_APP } from "~/constants.js";

export const assertWbPageNamespace = (namespace: string): void => {
    if (namespace !== WB_PAGE_APP) {
        throw new Error(`Invalid app name: "${namespace}".`);
    }
};
```

`packages/app-website-builder-workflows/src/features/gateway/graphql/WbOperationResponse.ts`:

```ts
/**
 * The response of one operation under the `websiteBuilder` root: the root field name maps to the
 * envelope the shared gateway interface returns.
 */
export interface WbOperationResponse<TName extends string, TEnvelope> {
    websiteBuilder: Record<TName, TEnvelope>;
}
```

The 14 documents, one per file under `packages/app-website-builder-workflows/src/features/gateway/graphql/`.

`listWebsiteBuilderPageWorkflows.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS = /* GraphQL */ `
    query ListWebsiteBuilderPageWorkflows {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
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

`getWebsiteBuilderPageTargetReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW = /* GraphQL */ `
    query GetWebsiteBuilderPageTargetReview($revisionId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageTargetReview(revisionId: $revisionId) {
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

`getWebsiteBuilderPageReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    query GetWebsiteBuilderPageReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
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

`listWebsiteBuilderPageReviews.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_REVIEWS = /* GraphQL */ `
    query ListWebsiteBuilderPageReviews(
        $list: WorkflowsReviewListKind!
        $where: WbPageReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        websiteBuilder {
            listWebsiteBuilderPageReviews(
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

`listWebsiteBuilderPageStepCandidates.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES = /* GraphQL */ `
    query ListWebsiteBuilderPageStepCandidates($workflowId: ID!, $stepId: ID!, $revisionId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageStepCandidates(
                workflowId: $workflowId
                stepId: $stepId
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

`listWebsiteBuilderPageReviewStepCandidates.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListWebsiteBuilderPageReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
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

`requestWebsiteBuilderPageReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REQUEST_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    mutation RequestWebsiteBuilderPageReview(
        $revisionId: ID!
        $title: String
        $picks: [WorkflowsReviewPickInput!]
    ) {
        websiteBuilder {
            requestWebsiteBuilderPageReview(
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

`startWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const START_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation StartWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            startWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

`takeOverWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation TakeOverWebsiteBuilderPageReviewStep(
        $reviewId: ID!
        $stepId: ID!
        $notifyPreviousOwner: Boolean
    ) {
        websiteBuilder {
            takeOverWebsiteBuilderPageReviewStep(
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

`reassignWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation ReassignWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        websiteBuilder {
            reassignWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                userId: $userId
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

`approveWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation ApproveWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            approveWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
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

`rejectWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REJECT_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation RejectWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            rejectWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
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

`cancelWebsiteBuilderPageReview.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    mutation CancelWebsiteBuilderPageReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
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

`cancelWebsiteBuilderPageReviewsForDelete.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelWebsiteBuilderPageReviewsForDelete(
        $pageId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(
                pageId: $pageId
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

`packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.ts`:

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
import { WbReviewGateway as GatewayAbstraction } from "./WbReviewGateway.js";
import { assertWbPageNamespace } from "./assertWbPageNamespace.js";
import type { WbOperationResponse } from "./graphql/WbOperationResponse.js";
import { APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/approveWebsiteBuilderPageReviewStep.js";
import { CANCEL_WEBSITE_BUILDER_PAGE_REVIEW } from "./graphql/cancelWebsiteBuilderPageReview.js";
import { CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE } from "./graphql/cancelWebsiteBuilderPageReviewsForDelete.js";
import { GET_WEBSITE_BUILDER_PAGE_REVIEW } from "./graphql/getWebsiteBuilderPageReview.js";
import { GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW } from "./graphql/getWebsiteBuilderPageTargetReview.js";
import { LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES } from "./graphql/listWebsiteBuilderPageReviewStepCandidates.js";
import { LIST_WEBSITE_BUILDER_PAGE_REVIEWS } from "./graphql/listWebsiteBuilderPageReviews.js";
import { LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES } from "./graphql/listWebsiteBuilderPageStepCandidates.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS } from "./graphql/listWebsiteBuilderPageWorkflows.js";
import { REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/reassignWebsiteBuilderPageReviewStep.js";
import { REJECT_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/rejectWebsiteBuilderPageReviewStep.js";
import { REQUEST_WEBSITE_BUILDER_PAGE_REVIEW } from "./graphql/requestWebsiteBuilderPageReview.js";
import { START_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/startWebsiteBuilderPageReviewStep.js";
import { TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/takeOverWebsiteBuilderPageReviewStep.js";

class WbReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "listWebsiteBuilderPageWorkflows",
                ReviewEnvelope<WorkflowDto[]>
            >
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS
        });

        return response.websiteBuilder.listWebsiteBuilderPageWorkflows;
    }

    async getTargetReview(target: ReviewTarget): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>> {
        assertWbPageNamespace(target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageTargetReview",
                ReviewEnvelope<ReviewWithFlagsDto | null>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW,
            variables: { revisionId: target.targetRevisionId }
        });

        return response.websiteBuilder.getWebsiteBuilderPageTargetReview;
    }

    async getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageReview",
                ReviewEnvelope<ReviewWithFlagsDto>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: { id: reviewId }
        });

        return response.websiteBuilder.getWebsiteBuilderPageReview;
    }

    async listStepCandidates(
        params: ListStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        assertWbPageNamespace(params.target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "listWebsiteBuilderPageStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES,
            variables: {
                workflowId: params.workflowId,
                stepId: params.stepId,
                revisionId: params.target.targetRevisionId
            }
        });

        return response.websiteBuilder.listWebsiteBuilderPageStepCandidates;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "listWebsiteBuilderPageReviewStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.listWebsiteBuilderPageReviewStepCandidates;
    }

    async listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope> {
        const response = await this.client.execute<
            WbOperationResponse<"listWebsiteBuilderPageReviews", ReviewListEnvelope>
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_REVIEWS,
            variables: {
                list: params.list,
                where: {
                    titleContains: params.where.titleContains,
                    reviewState: params.where.reviewState,
                    stepState: params.where.stepState
                },
                sort: params.sort,
                limit: params.limit,
                after: params.after
            }
        });

        return response.websiteBuilder.listWebsiteBuilderPageReviews;
    }

    async requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        assertWbPageNamespace(params.target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<"requestWebsiteBuilderPageReview", ReviewEnvelope<ReviewDto>>
        >({
            query: REQUEST_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: {
                revisionId: params.target.targetRevisionId,
                title: params.title,
                picks: params.picks
            }
        });

        return response.websiteBuilder.requestWebsiteBuilderPageReview;
    }

    async startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"startWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: START_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.startWebsiteBuilderPageReviewStep;
    }

    async takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"takeOverWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                notifyPreviousOwner: params.notifyPreviousOwner
            }
        });

        return response.websiteBuilder.takeOverWebsiteBuilderPageReviewStep;
    }

    async reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"reassignWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                userId: params.userId
            }
        });

        return response.websiteBuilder.reassignWebsiteBuilderPageReviewStep;
    }

    async approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"approveWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.websiteBuilder.approveWebsiteBuilderPageReviewStep;
    }

    async rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"rejectWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REJECT_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
    }

    async cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"cancelWebsiteBuilderPageReview", ReviewEnvelope<ReviewDto>>
        >({
            query: CANCEL_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: { reviewId: params.reviewId }
        });

        return response.websiteBuilder.cancelWebsiteBuilderPageReview;
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>> {
        assertWbPageNamespace(params.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "cancelWebsiteBuilderPageReviewsForDelete",
                ReviewEnvelope<ReviewDto[]>
            >
        >({
            query: CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE,
            variables: {
                pageId: params.targetId,
                revisionId: params.targetRevisionId,
                action: params.action
            }
        });

        return response.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
    }
}

export const WbReviewGateway = GatewayAbstraction.createImplementation({
    implementation: WbReviewGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCasesImpl.ts` (the shared `ReviewUseCases` bound under the WB token; the subclass is required, R238):

```ts
import { ReviewUseCases } from "@webiny/app-workflows/review/useCases/ReviewUseCases.js";
import { WbReviewGateway } from "./WbReviewGateway.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases.js";

/**
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `ReviewUseCases`, so each app binds its own subclass;
 * binding the shared class twice would let the second call overwrite the first.
 */
class WbReviewUseCasesImpl extends ReviewUseCases implements UseCasesAbstraction.Interface {}

export const WbReviewUseCases = UseCasesAbstraction.createImplementation({
    implementation: WbReviewUseCasesImpl,
    dependencies: [WbReviewGateway]
});
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.ts`:

```ts
import { Routes } from "@webiny/app-website-builder/routes.js";
import type { ReviewContentRef } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { assertWbPageNamespace } from "./assertWbPageNamespace.js";

class WbReviewContentAdapterImpl implements AdapterAbstraction.Interface {
    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    getContentUrl(ref: ReviewContentRef): string {
        assertWbPageNamespace(ref.namespace);

        return Routes.Pages.Editor.path.replace(":id", encodeURIComponent(ref.targetRevisionId));
    }

    getContentTypeLabel(): string | null {
        return null;
    }
}

export const WbReviewContentAdapter = AdapterAbstraction.createImplementation({
    implementation: WbReviewContentAdapterImpl,
    dependencies: []
});
```

`packages/app-website-builder-workflows/src/features/gateway/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapterImpl.js";
import { WbReviewGateway } from "./WbReviewGatewayImpl.js";
import { WbReviewUseCases } from "./WbReviewUseCasesImpl.js";

export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewUseCases).inSingletonScope();
        container.register(WbReviewContentAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction)
        };
    }
});
```

Modify `packages/app-website-builder-workflows/src/index.tsx`. Add the import after the `PageGetWorkflowsFeature` import:

```tsx
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";
import { WbReviewFeature } from "~/features/gateway/feature.js";
```

and register it first inside the gate (shared features are already registered by `WorkflowsAdminApp`, A77):

```tsx
    return (
        <>
            <RegisterFeature feature={WbReviewFeature} />
            <RegisterFeature feature={PageListWorkflowsFeature} />
            <RegisterFeature feature={PageGetWorkflowsFeature} />
```

Everything else in `index.tsx` stays (Tasks 22-24 and 37 replace the old registrations).

- [ ] **Step 4: Run the new tests to see them pass**

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: PASS. The coexistence test (`feature.test.ts`) imports the Task 11 files across packages. Vitest resolves `@webiny/*` through the tsconfig paths to `src`, so no build of the CMS package is needed; if a `~/` import inside a CMS file fails to resolve from here, record it in the commit and stop (do not move the A83 assertions out of this task). The devDependency adds a tsconfig reference from `app-website-builder-workflows` to `app-headless-cms-workflows` (a build-order coupling between the two app packages); this is accepted for the coexistence test.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

`WebsiteBuilderWorkflows` is the only existing file changed, and the package had no tests before this task. `check:test:types` lists only packages that have a `__tests__/**/*.test.ts` file, so for this package the type check of its co-located tests is the package build (R243); then the Task 11 tests:

```bash
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
```

Expected: the build prints no type errors, PASS. Resolve any mismatch against the final Task 8 types by correcting this task's code, not the shared types.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (the new devDependencies change `yarn.lock` and the generated `tsconfig` files, including the reference from this package to `app-headless-cms-workflows`; `yarn adio` must report no missing or unused dependency, add what it names), build the changed package with `--no-cache`, and restore `.gitleaks.toml`:

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-website-builder-workflows): add the WB review gateway, registration and content adapter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
