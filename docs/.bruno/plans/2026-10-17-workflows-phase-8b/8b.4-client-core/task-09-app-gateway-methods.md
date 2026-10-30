### Task 9: CMS and WB gateway methods

R202, R204, R257, R265; D161, D164; Review Focus 2 (the documents select only the `WorkflowsStepRunInfo` fields), 9 (the CMS pre-check maps `namespace` to `modelId`). Task 8 added `restartStep`, `getStepRun` and `listBlockingReviews` to `IReviewGateway`; this task implements them in the two app gateways so that every package builds again. Each method is one GraphQL document (one per file, the `cancelCmsEntryReview.ts` pattern) and one gateway method that runs it and returns the unwrapped envelope. No logic is added: error envelopes come back as they are (R204); the shared `ReviewUseCases` (Task 8) turns them into errors.

- **CMS documents** (`[CMSW]/features/gateway/graphql/`): `restartCmsEntryReviewStep.ts` (`RESTART_CMS_ENTRY_REVIEW_STEP`, mutation `RestartCmsEntryReviewStep($reviewId: ID!, $stepId: ID!)` under `cms`, selects `REVIEW_FIELDS` and `ERROR_FIELDS`, as `startCmsEntryReviewStep.ts`), `getCmsEntryReviewStepRun.ts` (`GET_CMS_ENTRY_REVIEW_STEP_RUN`, query `GetCmsEntryReviewStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!)`, selects `STEP_RUN_INFO_FIELDS`), `listCmsEntryBlockingReviews.ts` (`LIST_CMS_ENTRY_BLOCKING_REVIEWS`, query `ListCmsEntryBlockingReviews($modelId: ID!, $entryIds: [ID!]!)`, selects `BLOCKING_REVIEW_FIELDS`). The server queries exist from Tasks 5 and 7; the restart mutation exists since phase 6.
- **CMS gateway** (`CmsReviewGatewayImpl`): `restartStep(params)` runs the mutation with `{ reviewId, stepId }` and returns `response.cms.restartCmsEntryReviewStep`; `getStepRun(params)` runs the query with `{ reviewId, stepId, taskId }` and returns `response.cms.getCmsEntryReviewStepRun`; `listBlockingReviews(params)` maps `namespace` to `modelId` with `parseAppName` (removes the `cms.` prefix and throws `Invalid app name: "<ns>".` for another namespace before any request, as the other namespace-taking methods do) and `targetIds` to `entryIds`, and returns `response.cms.listCmsEntryBlockingReviews`.
- **WB documents** (`[WBW]/features/gateway/graphql/`): `restartWebsiteBuilderPageReviewStep.ts` (`RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP`) and `getWebsiteBuilderPageReviewStepRun.ts` (`GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN`), the same shapes under `websiteBuilder`. There is **no** blocking-reviews document: the WB bulk delete runs per item through the decorated delete use cases, so the 8a refusal flow already covers it (R265).
- **WB gateway** (`WbReviewGatewayImpl`): `restartStep` and `getStepRun` like the CMS ones (the review id selects the review, there is no namespace to assert); `listBlockingReviews()` returns `{ data: [], error: null }` without a request, with a comment that the WB bulk delete runs per item. It takes no parameter (a method with fewer parameters satisfies the interface).
- **Test doubles of `IReviewCancelForDeleteUseCases`** (the interface gained `listBlockingReviews` in Task 8): the nine in the CMS and WB packages get the one added property, mechanically (Step 3, hunk H).

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/gateway/graphql/restartCmsEntryReviewStep.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/graphql/getCmsEntryReviewStepRun.ts`
- Create: `packages/app-headless-cms-workflows/src/features/gateway/graphql/listCmsEntryBlockingReviews.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/graphql/restartWebsiteBuilderPageReviewStep.ts`
- Create: `packages/app-website-builder-workflows/src/features/gateway/graphql/getWebsiteBuilderPageReviewStepRun.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts`
- Modify (test doubles, hunk H): `packages/app-headless-cms-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator.test.ts, DeleteEntryRevisionUseCaseReviewDecorator.test.ts, DeleteEntryUseCaseReviewDecorator.test.ts, PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts, feature.test.tsx}`, `packages/app-website-builder-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator.test.ts, DeletePageRevisionUseCaseReviewDecorator.test.ts, DeletePageUseCaseReviewDecorator.test.ts, feature.test.tsx}`

**Interfaces:**
- Consumes: Task 8 (`IReviewGateway` with the three methods, `GetStepRunParams`, `ListBlockingReviewsParams`, `ReviewStepRunInfoDto`, `BlockingReviewDto`, `STEP_RUN_INFO_FIELDS`, `BLOCKING_REVIEW_FIELDS`, all by deep path `@webiny/app-workflows/review/...`); existing and verified: `parseAppName` (`~/utils/appName.js`, CMS), `assertWbPageNamespace` is not needed, `CmsOperationResponse`, `WbOperationResponse`, `ERROR_FIELDS`, `REVIEW_FIELDS`, `MainGraphQLClient`.
- Produces: the three CMS gateway methods and the two WB ones (WB `listBlockingReviews` is a constant empty answer); the five documents. The gateways are consumed through the unchanged `CmsReviewGateway` and `WbReviewGateway` tokens by the shared `ReviewUseCases` subclasses (`CmsReviewUseCasesImpl`, `WbReviewUseCasesImpl`), which need no change.

**Test runner note:** admin packages, `yarn test <path>` only. Neither package has `__tests__`, so the type check of the co-located tests is the package build (`yarn build -p @webiny/<package> --no-cache`, 8a R243). Build `@webiny/app-workflows` first: both packages import it by deep path from its `dist`.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts`.

Hunk A, imports (after the existing `REVIEW_FIELDS` import line, one per line):

```ts
import { BLOCKING_REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
```

Hunk B, the namespace test: add the new method to `it("rejects a non-CMS namespace before sending a request", ...)`:

```ts
// before
        const cancelForDelete = gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });

        await expect(targetReview).rejects.toThrow('Invalid app name: "wb.page".');

// after
        const cancelForDelete = gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });
        const blockingReviews = gateway.listBlockingReviews({
            namespace: "wb.page",
            targetIds: ["page-1"]
        });

        await expect(targetReview).rejects.toThrow('Invalid app name: "wb.page".');
```

and, after `await expect(cancelForDelete).rejects.toThrow('Invalid app name: "wb.page".');` add `        await expect(blockingReviews).rejects.toThrow('Invalid app name: "wb.page".');`.

Hunk C, three new tests, inserted before `it("returns an envelope error as is and never throws for it", ...)`:

```ts
    it("restarts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { restartCmsEntryReviewStep: envelope } });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("mutation RestartCmsEntryReviewStep");
        expect(request.query).toContain(
            "restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId)"
        );
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("returns a restart conflict as an envelope error and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/InvalidState", message: "Not failed.", data: null }
        };
        client.execute.mockResolvedValue({ cms: { restartCmsEntryReviewStep: envelope } });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("reads the run of a step by review, step and task id", async () => {
        const envelope = { data: { taskId: "task-1", status: "done" }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReviewStepRun: envelope } });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });
        expect(request.query).toContain("query GetCmsEntryReviewStepRun");
        expect(request.query).toContain(
            "getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId)"
        );
        expect(request.query).toContain(STEP_RUN_INFO_FIELDS);
    });

    it("returns a gone task (null data) as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReviewStepRun: envelope } });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("lists the blocking reviews of entries by the model id of the namespace (R265)", async () => {
        const envelope = { data: [{ reviewId: "review-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryBlockingReviews: envelope } });

        const result = await gateway.listBlockingReviews({
            namespace: "cms.article",
            targetIds: ["entry-1", "entry-2"]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            entryIds: ["entry-1", "entry-2"]
        });
        expect(request.query).toContain("query ListCmsEntryBlockingReviews");
        expect(request.query).toContain(
            "listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds)"
        );
        expect(request.query).toContain(BLOCKING_REVIEW_FIELDS);
    });
```

Modify `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts`.

Hunk A, imports (after the `REVIEW_FIELDS` import, one per line):

```ts
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
```

Hunk B, new tests, inserted before `it("returns an envelope error as is and never throws for it", ...)`:

```ts
    it("restarts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { restartWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("mutation RestartWebsiteBuilderPageReviewStep");
        expect(request.query).toContain(
            "restartWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId)"
        );
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("returns a restart conflict as an envelope error and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/InvalidState", message: "Not failed.", data: null }
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { restartWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("reads the run of a step by review, step and task id", async () => {
        const envelope = { data: { taskId: "task-1", status: "done" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReviewStepRun: envelope }
        });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });
        expect(request.query).toContain("query GetWebsiteBuilderPageReviewStepRun");
        expect(request.query).toContain(
            "getWebsiteBuilderPageReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId)"
        );
        expect(request.query).toContain(STEP_RUN_INFO_FIELDS);
    });

    it("returns a gone task (null data) as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReviewStepRun: envelope }
        });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("answers the blocking reviews with an empty list and sends no request (the WB bulk delete runs per item)", async () => {
        const result = await gateway.listBlockingReviews({
            namespace: "wb.page",
            targetIds: ["page-1", "page-2"]
        });

        expect(result).toEqual({ data: [], error: null });
        expect(client.execute).not.toHaveBeenCalled();
    });
```

(`listBlockingReviews` takes no parameter in the implementation; the test passes one because the interface method accepts it, which also proves the implementation ignores it.)

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -40
```

Expected: both files fail on the new cases with `gateway.restartStep is not a function`, `gateway.getStepRun is not a function` and `gateway.listBlockingReviews is not a function`; the namespace test fails the same way (CMS). The existing cases still pass.

- [ ] **Step 3: Implementation**

Create `packages/app-headless-cms-workflows/src/features/gateway/graphql/restartCmsEntryReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const RESTART_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation RestartCmsEntryReviewStep($reviewId: ID!, $stepId: ID!) {
        cms {
            restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

Create `packages/app-headless-cms-workflows/src/features/gateway/graphql/getCmsEntryReviewStepRun.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_REVIEW_STEP_RUN = /* GraphQL */ `
    query GetCmsEntryReviewStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        cms {
            getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId) {
                data {
                    ${STEP_RUN_INFO_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/gateway/graphql/listCmsEntryBlockingReviews.ts`:

```ts
import { BLOCKING_REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_BLOCKING_REVIEWS = /* GraphQL */ `
    query ListCmsEntryBlockingReviews($modelId: ID!, $entryIds: [ID!]!) {
        cms {
            listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds) {
                data {
                    ${BLOCKING_REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.ts`.

Hunk 1, type imports (one per line, next to their neighbours):

```ts
import type { BlockingReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { GetStepRunParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
```

Hunk 2, document imports (alphabetical by file name, as the file does):

```ts
import { GET_CMS_ENTRY_REVIEW_STEP_RUN } from "./graphql/getCmsEntryReviewStepRun.js";
import { LIST_CMS_ENTRY_BLOCKING_REVIEWS } from "./graphql/listCmsEntryBlockingReviews.js";
import { RESTART_CMS_ENTRY_REVIEW_STEP } from "./graphql/restartCmsEntryReviewStep.js";
```

Hunk 3, three methods, inserted before `async cancelForDelete(params: CancelForDeleteParams)`:

```ts
    async restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"restartCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: RESTART_CMS_ENTRY_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.restartCmsEntryReviewStep;
    }

    async getStepRun(
        params: GetStepRunParams
    ): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>> {
        const response = await this.client.execute<
            CmsOperationResponse<
                "getCmsEntryReviewStepRun",
                ReviewEnvelope<ReviewStepRunInfoDto | null>
            >
        >({
            query: GET_CMS_ENTRY_REVIEW_STEP_RUN,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                taskId: params.taskId
            }
        });

        return response.cms.getCmsEntryReviewStepRun;
    }

    async listBlockingReviews(
        params: ListBlockingReviewsParams
    ): Promise<ReviewEnvelope<BlockingReviewDto[]>> {
        const modelId = parseAppName(params.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryBlockingReviews", ReviewEnvelope<BlockingReviewDto[]>>
        >({
            query: LIST_CMS_ENTRY_BLOCKING_REVIEWS,
            variables: { modelId, entryIds: params.targetIds }
        });

        return response.cms.listCmsEntryBlockingReviews;
    }

```

Create `packages/app-website-builder-workflows/src/features/gateway/graphql/restartWebsiteBuilderPageReviewStep.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation RestartWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            restartWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

Create `packages/app-website-builder-workflows/src/features/gateway/graphql/getWebsiteBuilderPageReviewStepRun.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN = /* GraphQL */ `
    query GetWebsiteBuilderPageReviewStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId) {
                data {
                    ${STEP_RUN_INFO_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Modify `packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.ts`.

Hunk 1, type imports:

```ts
import type { BlockingReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { GetStepRunParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
```

Hunk 2, document imports:

```ts
import { GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN } from "./graphql/getWebsiteBuilderPageReviewStepRun.js";
import { RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "./graphql/restartWebsiteBuilderPageReviewStep.js";
```

Hunk 3, three methods, inserted before `async cancelForDelete(params: CancelForDeleteParams)`:

```ts
    async restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"restartWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.restartWebsiteBuilderPageReviewStep;
    }

    async getStepRun(
        params: GetStepRunParams
    ): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageReviewStepRun",
                ReviewEnvelope<ReviewStepRunInfoDto | null>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                taskId: params.taskId
            }
        });

        return response.websiteBuilder.getWebsiteBuilderPageReviewStepRun;
    }

    /*
     * The WB bulk delete runs per item through the decorated delete use cases, whose refusals the
     * 8a warning flow already handles, so there is nothing to pre-check (R265). No request is sent.
     */
    async listBlockingReviews(): Promise<ReviewEnvelope<BlockingReviewDto[]>> {
        return { data: [], error: null };
    }

```

Hunk H, the test doubles of `IReviewCancelForDeleteUseCases` (the interface gained `listBlockingReviews` in Task 8). From the repository root:

```bash
perl -0pi -e 's/^(\s+)(cancelForDelete: vi\.fn\(async \(_params: CancelForDeleteParams\): Promise<Review\[\]> => \[\]\))$/$1$2,\n$1listBlockingReviews: vi.fn(async () => [])/mg' \
  packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts \
  packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts \
  packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts \
  packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts \
  packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts \
  packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts \
  packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts
perl -0pi -e 's/\{ cancelForDelete: vi\.fn\(\) \}/{ cancelForDelete: vi.fn(), listBlockingReviews: vi.fn() }/g' \
  packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx \
  packages/app-website-builder-workflows/src/features/trash/feature.test.tsx
git diff --stat packages/app-headless-cms-workflows/src/features/trash packages/app-website-builder-workflows/src/features/trash
```

Expected: nine files, one added line each (`listBlockingReviews: vi.fn(async () => [])`, or the changed one-line object in the two `feature.test.tsx`). `yarn format:fix` in Step 6 re-wraps long lines.

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -30
```

Expected: both pass, including the unchanged cases.

- [ ] **Step 5: Run the existing tests that cover the changed code, and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/trash 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/gateway 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/trash 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: no failures, no type errors. The two builds type-check every co-located test; `CmsReviewGatewayImpl` and `WbReviewGatewayImpl` now satisfy `IReviewGateway` again, and the nine trash test doubles satisfy `IReviewCancelForDeleteUseCases`. If a build reports another `IReviewUseCases`-shaped test double in these packages, add the missing property the same way.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): implement restart, step run and blocking reviews in the CMS and WB gateways" \
  -m "One document per operation. The WB gateway answers the blocking reviews with an empty list because its bulk delete runs per item." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" \
  -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the start. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`.

**Contract notes:**
- The WB `listBlockingReviews` takes no parameter (the contract lists none and the comment explains why); TypeScript accepts the shorter signature for `IReviewGateway`.
- The CMS and WB server queries (`getCmsEntryReviewStepRun`, `getWebsiteBuilderPageReviewStepRun`, `listCmsEntryBlockingReviews`) come from 8b.2 and 8b.3 and need not run for this task (the documents are strings tested against the mock client). Checked in the consistency pass: the SDL of Tasks 5 and 6 declares `(reviewId: ID!, stepId: ID!, taskId: ID!)` and Task 7 declares `(modelId: ID!, entryIds: [ID!]!)`, the argument names these documents use.
