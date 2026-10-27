### Task 11: `WebsiteBuilderWorkflowsSchemaFactory` on `WbQuery` / `WbMutation`, `WbPage.system.workflow`

Spec 10, D120, D132, D133, D136; R88, R100, R102 (A45), R104, R107. Every Website Builder pages workflow and review operation goes on the existing `websiteBuilder` root of `/graphql`, as `extend type WbQuery` / `extend type WbMutation` from one `GraphQLSchemaFactory` registered inside the license gate of `WebsiteBuilderWorkflowsFeature`. Each resolver depends on one WB wrapper use case, calls it inline with its arguments (pure argument mapping only: `targetId: parseIdentifier(revisionId).id` for the request, after the pure `isValidRevisionId` check (R107: a malformed id returns `new ErrorResponse(new ReviewValidationError("The revision id is not valid."))`, never a thrown error), `revisionId` → `targetRevisionId` for the target review, `pageId` → `targetId` for cancel-for-delete, GraphQL `null` → `undefined` where a wrapper input is not nullable) and maps a failed Result with `new ErrorResponse(result.error)` / `new ListErrorResponse(result.error)`, which keeps `code`, `message` and `data` (Review Focus 5). Resolvers never catch: a thrown wrapper error is a bug (R87, R100).

The factory reuses the shared `Workflows*` types of Task 6 (`WorkflowsError`, `WorkflowsListMeta`, `WorkflowsWorkflow`, `WorkflowsWorkflowInput`, `WorkflowsReview`, `WorkflowsReviewWithFlags`, `WorkflowsReviewListKind`, `WorkflowsReviewListSort`, `WorkflowsReviewState`, `WorkflowsStepState`) plus `WorkflowsReviewPickInput { stepId: String!, userId: String! }` and the enum `WorkflowsReviewsForDeleteAction { trash delete }` (added to Task 6's shared SDL for both apps), and adds only its envelopes, its root fields and one WB input: `WbPageReviewListWhere` (the shared `WorkflowsReviewListWhere` carries the CMS-only `modelId`; the WB list has no model filter). `savedOn` is a `String` input (R104).

`WbPage.system` gets its own type on `/graphql` (R102): Website Builder's base schema declares `system: WbPageSystem` (a placeholder `type WbPageSystem { _empty: String }`, replacing the `CmsEntrySystem` placeholder reference on `WbPage`), and `WebsiteBuilderPageSchemaFactory` adds `extend type WbPageSystem { workflow: WbPageSystemWorkflow }` with the stored shape `{ workflowId, reviewState, stepId, stepName, stepState }`. The page object the WB resolvers return already carries `system` (`EntryToPageMapper`), so no resolver is needed; the old `extend type WbPage { system: CmsEntrySystem }` and its legacy resolver go. The old admin's page field selections that select `state` stay broken (A45: accepted, no admin package changes in phase 3).

The WB test handler returns `invoke` next to `context`, and every operation is tested through GraphQL: success, an error with its `code` and `data`, the list returning only page reviews (Review Focus 6), and the license gate (own file).

`parseIdentifier` comes from `@webiny/utils` (R88), which `api-website-builder-workflows` does not list yet: this task adds it to `dependencies` (R101 allows it for this package).

**Files:**
- Create: `packages/api-website-builder-workflows/src/graphql/types.ts`
- Create: `packages/api-website-builder-workflows/src/graphql/isValidRevisionId.ts`
- Create: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderPageSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`
- Modify: `packages/api-website-builder-workflows/package.json`
- Modify: `packages/api-website-builder/src/graphql/pages/pages.typeDefs.ts`
- Modify: `packages/api-website-builder/src/graphql/createGraphQL.ts` (comment on the `CmsEntrySystem` placeholder)
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/userContext.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflows.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageReviewLists.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageSystemWorkflow.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts`
- Delete: `packages/api-website-builder-workflows/__tests__/wbPageSystem.test.ts` (replaced by `graphql/pageSystemWorkflow.test.ts` and `graphql/license.test.ts`)

**Interfaces:**
- Consumes:
  - Task 6 (`WorkflowsSchemaFactory`, registered by `WorkflowsFeature`): the SDL types listed above, exactly as Task 6 Step 4 defines them, plus `input WorkflowsReviewPickInput { stepId: String! userId: String! }` and `enum WorkflowsReviewsForDeleteAction { trash delete }`.
  - Task 10: `ListWebsiteBuilderPageReviewsUseCase` (`ListWebsiteBuilderPageReviewsInput`, nullable `where` / `sort` / `limit` / `after`), `GetWebsiteBuilderPageTargetReviewUseCase` (`{ targetRevisionId }`), `GetWebsiteBuilderPageReviewUseCase` (`ReviewWithAssignmentsAndViewerFlags`), `RequestWebsiteBuilderPageReviewInput.title`, `seedAssignments` (tests).
  - Phase 2 wrappers (unchanged inputs): `StoreWebsiteBuilderPageWorkflowUseCase { workflow, savedOn? }`, `DeleteWebsiteBuilderPageWorkflowUseCase { id }`, `ListWebsiteBuilderPageWorkflowsUseCase` (no input), `GetWebsiteBuilderPageWorkflowUseCase { id }`, `RequestWebsiteBuilderPageReviewUseCase { targetId, targetRevisionId, title?, picks? }`, `Start…` / `TakeOver…ReviewStepUseCase { reviewId, stepId }`, `Approve…` / `Reject…ReviewStepUseCase { reviewId, stepId, comment? }`, `CancelWebsiteBuilderPageReviewUseCase { reviewId }`, `CancelWebsiteBuilderPageReviewsForDeleteUseCase { targetId, action }`.
  - `GraphQLSchemaFactory` (`@webiny/api-graphql/graphql/abstractions.js`), `Response`, `ListResponse`, `ErrorResponse`, `ListErrorResponse` (`@webiny/api-graphql`), `parseIdentifier` (`@webiny/utils`), `ReviewValidationError` (`@webiny/api-workflows/domain/review/errors.js`, message only, no data).
  - Engine types: `ReviewListKind`, `ReviewListSort`, `ReviewListWhere`, `ReviewPick` (`@webiny/api-workflows/domain/review/types.js`), `WorkflowValues` (`@webiny/api-workflows/domain/workflow/types.js`), `ReviewActiveOnTrashAction` (`@webiny/api-workflows/domain/review/errors.js`).
- Produces:
  - `WebsiteBuilderWorkflowsSchemaFactory` (`src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`), not exported from the barrel.
  - `isValidRevisionId(revisionId: string): boolean` (`src/graphql/isValidRevisionId.ts`, pure, R107; the CMS package has its own copy, inline duplication intended).
  - SDL: envelopes `WbPageWorkflowResponse { data: WorkflowsWorkflow error: WorkflowsError }`, `WbPageWorkflowListResponse { data: [WorkflowsWorkflow!] meta: WorkflowsListMeta error }`, `WbPageReviewResponse { data: WorkflowsReview error }`, `WbPageReviewArrayResponse { data: [WorkflowsReview!] error }`, `WbPageReviewWithFlagsResponse { data: WorkflowsReviewWithFlags error }`, `WbPageReviewListResponse { data: [WorkflowsReviewWithFlags!] meta: WorkflowsListMeta error }`; input `WbPageReviewListWhere { titleContains: String reviewState: WorkflowsReviewState stepState: WorkflowsStepState }`.
  - `WbQuery`: `listWebsiteBuilderPageWorkflows`, `getWebsiteBuilderPageWorkflow(id)`, `getWebsiteBuilderPageReview(id)`, `getWebsiteBuilderPageTargetReview(revisionId)`, `listWebsiteBuilderPageReviews(list, where, sort, limit, after)`. `WbMutation`: `storeWebsiteBuilderPageWorkflow(data, savedOn)`, `deleteWebsiteBuilderPageWorkflow(id)`, `requestWebsiteBuilderPageReview(revisionId, title, picks)`, `startWebsiteBuilderPageReviewStep(reviewId, stepId)`, `takeOverWebsiteBuilderPageReviewStep(reviewId, stepId)`, `approveWebsiteBuilderPageReviewStep(reviewId, stepId, comment)`, `rejectWebsiteBuilderPageReviewStep(reviewId, stepId, comment)`, `cancelWebsiteBuilderPageReview(reviewId)`, `cancelWebsiteBuilderPageReviewsForDelete(pageId, action)`.
  - `type WbPageSystem { _empty: String }` (api-website-builder) and `type WbPageSystemWorkflow { workflowId: String reviewState: String stepId: String stepName: String stepState: String }`, `extend type WbPageSystem { workflow: WbPageSystemWorkflow }`.
  - Test harness: `createContextHandler(params)` returns `{ context, invoke }`; `UserContextParams.testProjectLicense`; `createUserHandler(params)`; `asGraphQLUser(params)` → `{ context, run(query, variables?) }`.

- [ ] **Step 1: The test harness**

Replace the `createContextHandler` body's first line and return in `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`: change

```ts
    const { getContext } = createCmsTestHandler({
```

to

```ts
    const { getContext, invoke } = createCmsTestHandler({
```

and

```ts
    return {
        context: () => getContext()
    };
```

to

```ts
    return {
        context: () => getContext(),
        /** POST to `/graphql` as the handler's identity. */
        invoke
    };
```

Replace `packages/api-website-builder-workflows/__tests__/__helpers/userContext.ts` with:

```ts
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "./handler.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";

/** Both reviewers are in the test step's team; nobody else is in any team. */
const TEAMS: Record<string, string[]> = {
    [REVIEWER.id]: [REVIEW_TEAM],
    [OTHER_REVIEWER.id]: [REVIEW_TEAM]
};

export interface UserContextParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    legacyPlugins?: unknown[];
    /** Defaults to the test license (every feature on). */
    testProjectLicense?: DecryptedWcpProjectLicense;
}

/** A handler as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserHandler = (params: UserContextParams = {}) => {
    return createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        testProjectLicense: params.testProjectLicense,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
};

/** A request context as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserContext = async (params: UserContextParams = {}): Promise<CmsContext> => {
    return (await createUserHandler(params).context()) as CmsContext;
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`:

```ts
import { createUserHandler, type UserContextParams } from "./userContext.js";

/** A user that sends GraphQL requests to `/graphql`; `run` returns the response body. */
export const asGraphQLUser = (params: UserContextParams = {}) => {
    const handler = createUserHandler(params);
    return {
        context: handler.context,
        run: async (query: string, variables: Record<string, unknown> = {}) => {
            const [body] = await handler.invoke({ body: { query, variables } });
            return body;
        }
    };
};

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    savedOn
    steps {
        id
        title
        type
        config
    }
`;

const REVIEW_FIELDS = /* GraphQL */ `
    id
    model
    targetId
    targetRevisionId
    title
    isActive
    state
    currentStepId
    currentStepState
    currentStepType
    createdBy {
        id
        displayName
    }
    steps {
        id
        state
        owner {
            id
        }
        comment
    }
`;

const FLAGS_FIELDS = /* GraphQL */ `
    flags {
        canStart
        canTakeOver
        canApprove
        canReject
        canCancel
        canReassign
        canRestart
    }
`;

/** A review read: steps carry their assignment-log entries (R96). */
const REVIEW_DETAIL_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
        steps {
            id
            description
            assignments {
                id
                kind
                source
                userId
                reason
            }
        }
    }
    ${FLAGS_FIELDS}
`;

export const LIST_WORKFLOWS = /* GraphQL */ `
    query ListWorkflows {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
                data { ${WORKFLOW_FIELDS} }
                meta {
                    cursor
                    hasMoreItems
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_WORKFLOW = /* GraphQL */ `
    query GetWorkflow($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageWorkflow(id: $id) {
                data { ${WORKFLOW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        websiteBuilder {
            storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn) {
                data { ${WORKFLOW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWorkflow($id: ID!) {
        websiteBuilder {
            deleteWebsiteBuilderPageWorkflow(id: $id) {
                data { id }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
                data { ${REVIEW_DETAIL_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($revisionId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageTargetReview(revisionId: $revisionId) {
                data { ${REVIEW_DETAIL_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews(
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
                    review { ${REVIEW_FIELDS} }
                    ${FLAGS_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($revisionId: ID!, $title: String, $picks: [WorkflowsReviewPickInput!]) {
        websiteBuilder {
            requestWebsiteBuilderPageReview(revisionId: $revisionId, title: $title, picks: $picks) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const START_STEP = /* GraphQL */ `
    mutation StartStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            startWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            takeOverWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const APPROVE_STEP = /* GraphQL */ `
    mutation ApproveStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            approveWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const REJECT_STEP = /* GraphQL */ `
    mutation RejectStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            rejectWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete($pageId: ID!, $action: WorkflowsReviewsForDeleteAction!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(pageId: $pageId, action: $action) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_PAGE_SYSTEM = /* GraphQL */ `
    query GetPageSystem($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
                data {
                    id
                    system {
                        workflow {
                            workflowId
                            reviewState
                            stepId
                            stepName
                            stepState
                        }
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const TYPE_FIELDS = /* GraphQL */ `
    query TypeFields($name: String!) {
        __type(name: $name) {
            fields {
                name
            }
        }
    }
`;
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflows.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createWbWorkflowValues, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { REVIEWER, WB_READER } from "~tests/__helpers/identities.js";
import {
    asGraphQLUser,
    DELETE_WORKFLOW,
    GET_WORKFLOW,
    LIST_WORKFLOWS,
    STORE_WORKFLOW
} from "~tests/__helpers/graphql.js";

describe("WB workflow operations through GraphQL", () => {
    it("stores, lists, gets, updates and deletes the pages workflow", async () => {
        const admin = asGraphQLUser();

        const created = await admin.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        const stored = created.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        const listed = await admin.run(LIST_WORKFLOWS);
        const read = await admin.run(GET_WORKFLOW, { id: "wb-workflow" });
        const updated = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), name: "Pages review v2" },
            savedOn: stored.data.savedOn
        });
        const deleted = await admin.run(DELETE_WORKFLOW, { id: "wb-workflow" });

        expect(stored.error).toBeNull();
        expect(stored.data).toMatchObject({ id: "wb-workflow", models: ["wb.page"] });
        expect(stored.data.steps).toEqual([
            {
                id: "step-1",
                title: "Step 1",
                type: "review",
                config: createWbWorkflowValues().steps[0].config
            }
        ]);
        expect(
            listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.data.map(
                (workflow: { id: string }) => workflow.id
            )
        ).toEqual(["wb-workflow"]);
        expect(listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.meta).toEqual({
            cursor: null,
            hasMoreItems: false
        });
        expect(read.data.websiteBuilder.getWebsiteBuilderPageWorkflow.data.name).toBe(
            "Pages review"
        );
        expect(updated.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.error).toBeNull();
        expect(updated.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.data.name).toBe(
            "Pages review v2"
        );
        expect(deleted.data.websiteBuilder.deleteWebsiteBuilderPageWorkflow).toEqual({
            data: { id: "wb-workflow" },
            error: null
        });
    });

    it("returns the conflict error with its code and data when savedOn is stale (D131)", async () => {
        const workflow = await storeWbWorkflow(await createUserContext());
        const admin = asGraphQLUser();

        const body = await admin.run(STORE_WORKFLOW, {
            data: createWbWorkflowValues(),
            savedOn: "2020-01-01T00:00:00.000Z"
        });
        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: workflow.savedOn,
            savedBy: workflow.savedBy
        });
    });

    it("returns Workflows/NotAuthorized with data to a user without editor", async () => {
        await storeWbWorkflow(await createUserContext());
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const stored = await reviewer.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        const deleted = await reviewer.run(DELETE_WORKFLOW, { id: "wb-workflow" });

        for (const result of [
            stored.data.websiteBuilder.storeWebsiteBuilderPageWorkflow,
            deleted.data.websiteBuilder.deleteWebsiteBuilderPageWorkflow
        ]) {
            expect(result.data).toBeNull();
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "manage workflows" });
        }
    });

    it("does not return a Headless CMS workflow (R46)", async () => {
        const setup = await createUserContext();
        await storeWbWorkflow(setup);
        await createCmsReview(setup);
        const admin = asGraphQLUser();

        const read = await admin.run(GET_WORKFLOW, { id: "cms-workflow" });
        const listed = await admin.run(LIST_WORKFLOWS);

        expect(read.data.websiteBuilder.getWebsiteBuilderPageWorkflow.error.code).toBe(
            "Workflows/Workflow/NotFound"
        );
        expect(read.data.websiteBuilder.getWebsiteBuilderPageWorkflow.error.data).toEqual({
            id: "cms-workflow"
        });
        expect(
            listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.data.map(
                (workflow: { id: string }) => workflow.id
            )
        ).toEqual(["wb-workflow"]);
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import {
    requestPageReview,
    startPageReview,
    STEP_ID,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { seedAssignments } from "~tests/__helpers/assignments.js";
import {
    NOBODY,
    OTHER_REVIEWER,
    READER,
    REQUESTER,
    REVIEWER,
    WB_DELETER,
    WB_READER,
    WB_WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    APPROVE_STEP,
    asGraphQLUser,
    CANCEL_REVIEW,
    CANCEL_REVIEWS_FOR_DELETE,
    GET_REVIEW,
    GET_TARGET_REVIEW,
    REJECT_STEP,
    REQUEST_REVIEW,
    START_STEP,
    TAKE_OVER_STEP
} from "~tests/__helpers/graphql.js";

/** Admin stores the pages workflow; REQUESTER's review of a root page, plus a page without one. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    return { admin, page, lockedPage, quietPage, review };
};

describe("WB review operations through GraphQL", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("requests a review with a title; the resolver derives the page id from the revision id", async () => {
        const { quietPage } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const body = await requester.run(REQUEST_REVIEW, {
            revisionId: quietPage.id,
            title: "Homepage launch"
        });
        const result = body.data.websiteBuilder.requestWebsiteBuilderPageReview;

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            model: "wb.page",
            targetId: quietPage.entryId,
            targetRevisionId: quietPage.id,
            title: "Homepage launch",
            state: "inProgress",
            currentStepType: "review",
            createdBy: { id: REQUESTER.id, displayName: REQUESTER.displayName }
        });
    });

    it("returns the title validation error and Workflows/NotAuthorized with their codes", async () => {
        const { quietPage } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });
        const reader = asGraphQLUser({ identity: READER, permissions: WB_READER });

        const short = await requester.run(REQUEST_REVIEW, {
            revisionId: quietPage.id,
            title: "Home"
        });
        const refused = await reader.run(REQUEST_REVIEW, { revisionId: quietPage.id });

        const shortResult = short.data.websiteBuilder.requestWebsiteBuilderPageReview;
        expect(shortResult.data).toBeNull();
        expect(shortResult.error.code).toBe("Workflows/Review/Validation");
        expect(shortResult.error.message).toBe(
            "The review title must have at least 5 characters."
        );
        const refusedResult = refused.data.websiteBuilder.requestWebsiteBuilderPageReview;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({ action: "request a review" });
    });

    it("returns the revision id validation error for a malformed revision id (R107)", async () => {
        await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        for (const revisionId of ["#0001", "abc", "abc#x"]) {
            const body = await requester.run(REQUEST_REVIEW, { revisionId });

            expect(body.errors).toBeUndefined();
            expect(body.data.websiteBuilder.requestWebsiteBuilderPageReview).toEqual({
                data: null,
                error: {
                    code: "Workflows/Review/Validation",
                    message: "The revision id is not valid.",
                    data: null
                }
            });
        }
    });

    it("gets a review with flags and redacted assignment entries, and not a Headless CMS review (R46)", async () => {
        const { admin, review } = await createScenario();
        const { outcome } = await seedAssignments(admin, review);
        const cmsReview = await createCmsReview(admin);
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const read = await reviewer.run(GET_REVIEW, { id: review.id });
        const cms = await reviewer.run(GET_REVIEW, { id: cmsReview.id });

        const readResult = read.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(readResult.error).toBeNull();
        expect(readResult.data.review.id).toBe(review.id);
        expect(readResult.data.flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(readResult.data.review.steps[0].description).toBe("This is step 1");
        expect(readResult.data.review.steps[0].assignments).toEqual([
            { id: outcome.id, kind: "outcome", source: "pool", userId: null, reason: null }
        ]);
        const cmsResult = cms.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(cmsResult.data).toBeNull();
        expect(cmsResult.error.code).toBe("Workflows/Review/NotFound");
        expect(cmsResult.error.data).toEqual({ id: cmsReview.id });
    });

    it("gets the target review of a revision, null without one, and refuses an unreadable page", async () => {
        const { admin, page, lockedPage, quietPage, review } = await createScenario();
        await requestPageReview(admin, lockedPage);
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const withReview = await reviewer.run(GET_TARGET_REVIEW, { revisionId: page.id });
        const without = await reviewer.run(GET_TARGET_REVIEW, { revisionId: quietPage.id });
        const locked = await reviewer.run(GET_TARGET_REVIEW, { revisionId: lockedPage.id });

        expect(withReview.data.websiteBuilder.getWebsiteBuilderPageTargetReview.data.review.id).toBe(
            review.id
        );
        expect(without.data.websiteBuilder.getWebsiteBuilderPageTargetReview).toEqual({
            data: null,
            error: null
        });
        const lockedResult = locked.data.websiteBuilder.getWebsiteBuilderPageTargetReview;
        expect(lockedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(lockedResult.error.data).toEqual({ action: "view this review" });
    });

    it("starts, takes over and approves a step", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const otherReviewer = asGraphQLUser({ identity: OTHER_REVIEWER, permissions: WB_READER });

        const started = await reviewer.run(START_STEP, { reviewId: review.id, stepId: STEP_ID });
        const takenOver = await otherReviewer.run(TAKE_OVER_STEP, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const approved = await otherReviewer.run(APPROVE_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Looks good."
        });

        const startResult = started.data.websiteBuilder.startWebsiteBuilderPageReviewStep;
        expect(startResult.error).toBeNull();
        expect(startResult.data.steps[0]).toMatchObject({
            state: "inReview",
            owner: { id: REVIEWER.id }
        });
        expect(
            takenOver.data.websiteBuilder.takeOverWebsiteBuilderPageReviewStep.data.steps[0].owner
        ).toEqual({ id: OTHER_REVIEWER.id });
        const approveResult = approved.data.websiteBuilder.approveWebsiteBuilderPageReviewStep;
        expect(approveResult.error).toBeNull();
        expect(approveResult.data.state).toBe("approved");
        expect(approveResult.data.steps[0].comment).toBe("Looks good.");
    });

    it("returns Workflows/Review/NotCandidate with data to a reader outside the step's teams", async () => {
        const { review } = await createScenario();
        const outsider = asGraphQLUser({ identity: NOBODY, permissions: WB_READER });

        const body = await outsider.run(START_STEP, { reviewId: review.id, stepId: STEP_ID });
        const result = body.data.websiteBuilder.startWebsiteBuilderPageReviewStep;

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(result.error.data).toEqual({ reviewId: review.id, stepId: STEP_ID });
    });

    it("rejects a step only with a comment of at least 10 characters (D100)", async () => {
        const { admin, review } = await createScenario();
        await startPageReview(admin, review);
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const short = await reviewer.run(REJECT_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Too short"
        });
        const rejected = await reviewer.run(REJECT_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Needs another pass."
        });

        const shortResult = short.data.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
        expect(shortResult.error.code).toBe("Workflows/Review/Validation");
        expect(shortResult.error.message).toBe(
            "A rejection needs a comment of at least 10 characters."
        );
        const rejectResult = rejected.data.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
        expect(rejectResult.error).toBeNull();
        expect(rejectResult.data.state).toBe("rejected");
    });

    it("cancels a review as its requester and refuses another user with data", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const refused = await reviewer.run(CANCEL_REVIEW, { reviewId: review.id });
        const cancelled = await requester.run(CANCEL_REVIEW, { reviewId: review.id });

        const refusedResult = refused.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({
            action: "cancel a review requested by someone else"
        });
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({ state: "cancelled", isActive: false });
    });

    it("cancels a page's reviews before a trash, by page id, only with delete access (D134)", async () => {
        const { page, review } = await createScenario();
        const reader = asGraphQLUser({ identity: READER, permissions: WB_READER });
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const refused = await reader.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });
        const cancelled = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        const refusedResult = refused.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({
            action: "cancel the review to delete this content"
        });
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toHaveLength(1);
        expect(cancelResult.data[0]).toMatchObject({ id: review.id, state: "cancelled" });
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageReviewLists.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { REQUESTER, REVIEWER, WB_READER, WB_WRITER } from "~tests/__helpers/identities.js";
import { asGraphQLUser, LIST_REVIEWS } from "~tests/__helpers/graphql.js";

interface ListedRow {
    review: { id: string };
}

const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const otherPage = await createPage(admin, { title: "Page B" });
    const review = await requestPageReview(admin, page);
    // The order tests compare `lastChangedOn`; keep the two requests in different milliseconds.
    await new Promise(resolve => setTimeout(resolve, 5));
    const otherReview = await requestPageReview(admin, otherPage);
    const cmsReview = await createCmsReview(admin);
    return { review, otherReview, cmsReview };
};

const ids = (rows: ListedRow[]): string[] => {
    return rows.map(row => row.review.id);
};

describe("WB review lists through GraphQL", () => {
    it("lists only page reviews, with flags and meta (R46, D133)", async () => {
        const { review, otherReview, cmsReview } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const body = await reviewer.run(LIST_REVIEWS, { list: "pool" });
        const result = body.data.websiteBuilder.listWebsiteBuilderPageReviews;

        expect(result.error).toBeNull();
        expect(ids(result.data)).toEqual([review.id, otherReview.id]);
        expect(ids(result.data)).not.toContain(cmsReview.id);
        expect(result.data[0].flags.canStart).toBe(true);
        expect(result.meta.hasMoreItems).toBe(false);
    });

    it("pages with limit and after", async () => {
        const { review, otherReview } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const first = await reviewer.run(LIST_REVIEWS, { list: "pool", limit: 1 });
        const firstResult = first.data.websiteBuilder.listWebsiteBuilderPageReviews;
        const second = await reviewer.run(LIST_REVIEWS, {
            list: "pool",
            limit: 1,
            after: firstResult.meta.cursor
        });
        const secondResult = second.data.websiteBuilder.listWebsiteBuilderPageReviews;

        expect(ids(firstResult.data)).toEqual([review.id]);
        expect(firstResult.meta.hasMoreItems).toBe(true);
        expect(ids(secondResult.data)).toEqual([otherReview.id]);
        expect(secondResult.meta.hasMoreItems).toBe(false);
    });

    it("filters my requests by state and title, sorted as asked", async () => {
        const { review, otherReview } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const newestFirst = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            where: { reviewState: "inProgress" }
        });
        const oldestFirst = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC"
        });
        const byTitle = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            where: { titleContains: "Page B" }
        });

        expect(ids(newestFirst.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            otherReview.id,
            review.id
        ]);
        expect(ids(oldestFirst.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            review.id,
            otherReview.id
        ]);
        expect(ids(byTitle.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            otherReview.id
        ]);
    });

    it("returns the list errors with code, data and a null meta", async () => {
        await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const failed = await reviewer.run(LIST_REVIEWS, { list: "failedSteps" });
        const stateFilter = await reviewer.run(LIST_REVIEWS, {
            list: "pool",
            where: { stepState: "awaiting" }
        });

        expect(failed.data.websiteBuilder.listWebsiteBuilderPageReviews).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: expect.any(String),
                data: { action: "list failed steps" }
            }
        });
        const stateResult = stateFilter.data.websiteBuilder.listWebsiteBuilderPageReviews;
        expect(stateResult.meta).toBeNull();
        expect(stateResult.error.code).toBe("Workflows/Review/Validation");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageSystemWorkflow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { asGraphQLUser, GET_PAGE_SYSTEM } from "~tests/__helpers/graphql.js";

describe("WbPage.system.workflow on /graphql (R102)", () => {
    it("returns the stored system.workflow of a page under review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        await requestPageReview(admin, page);

        const body = await asGraphQLUser().run(GET_PAGE_SYSTEM, { id: page.id });
        const result = body.data.websiteBuilder.getPageById;

        expect(result.error).toBeNull();
        expect(result.data.system.workflow).toEqual({
            workflowId: "wb-workflow",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
    });

    it("returns a null workflow for a page that was never reviewed", async () => {
        const admin = await createUserContext();
        const page = await createPage(admin, { title: "Page A" });

        const body = await asGraphQLUser().run(GET_PAGE_SYSTEM, { id: page.id });

        expect(body.data.websiteBuilder.getPageById.data.system?.workflow ?? null).toBeNull();
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { asGraphQLUser, TYPE_FIELDS } from "~tests/__helpers/graphql.js";

const QUERIES = [
    "listWebsiteBuilderPageWorkflows",
    "getWebsiteBuilderPageWorkflow",
    "getWebsiteBuilderPageReview",
    "getWebsiteBuilderPageTargetReview",
    "listWebsiteBuilderPageReviews"
];

const MUTATIONS = [
    "storeWebsiteBuilderPageWorkflow",
    "deleteWebsiteBuilderPageWorkflow",
    "requestWebsiteBuilderPageReview",
    "startWebsiteBuilderPageReviewStep",
    "takeOverWebsiteBuilderPageReviewStep",
    "approveWebsiteBuilderPageReviewStep",
    "rejectWebsiteBuilderPageReviewStep",
    "cancelWebsiteBuilderPageReview",
    "cancelWebsiteBuilderPageReviewsForDelete"
];

interface TypeField {
    name: string;
}

const fieldNames = async (user: ReturnType<typeof asGraphQLUser>, name: string) => {
    const body = await user.run(TYPE_FIELDS, { name });
    return ((body.data.__type?.fields ?? []) as TypeField[]).map(field => field.name);
};

describe("WB workflows GraphQL and the advancedPublishingWorkflow license (R100)", () => {
    it("adds every WB operation and WbPageSystem.workflow with the license", async () => {
        const admin = asGraphQLUser();

        expect(await fieldNames(admin, "WbQuery")).toEqual(expect.arrayContaining(QUERIES));
        expect(await fieldNames(admin, "WbMutation")).toEqual(expect.arrayContaining(MUTATIONS));
        expect(await fieldNames(admin, "WbPageSystem")).toContain("workflow");
    });

    it("adds nothing without the license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const admin = asGraphQLUser({ testProjectLicense: license });

        const queries = await fieldNames(admin, "WbQuery");
        const mutations = await fieldNames(admin, "WbMutation");

        expect(queries).toContain("getPageById");
        for (const name of QUERIES) {
            expect(queries).not.toContain(name);
        }
        for (const name of MUTATIONS) {
            expect(mutations).not.toContain(name);
        }
        expect(await fieldNames(admin, "WbPageSystem")).toEqual(["_empty"]);
    });
});
```

Delete `packages/api-website-builder-workflows/__tests__/wbPageSystem.test.ts`.

- [ ] **Step 3: Run the tests to see them fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql 2>&1 | tail -50`

Expected: FAIL. Every operation test fails with a GraphQL validation error in the body (`Cannot query field "storeWebsiteBuilderPageWorkflow" on type "WbMutation"`, `Unknown type "WbPageReviewListWhere"`), so the test reads `body.data` as undefined (`TypeError: Cannot read properties of undefined (reading 'websiteBuilder')`); `pageSystemWorkflow.test.ts` fails with `Cannot query field "workflow" on type "CmsEntrySystem"`; the licensed case of `license.test.ts` fails on the missing fields and the unlicensed case fails with `expected [] to deeply equal [ '_empty' ]` (no `WbPageSystem` type yet). Record the output.

- [ ] **Step 4: The resolver argument types and the revision id check**

Create `packages/api-website-builder-workflows/src/graphql/types.ts`:

```ts
import type {
    ReviewListKind,
    ReviewListSort,
    ReviewListWhere,
    ReviewPick
} from "@webiny/api-workflows/domain/review/types.js";
import type { ReviewActiveOnTrashAction } from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";

// Resolver arguments as GraphQL passes them: an optional argument sent as `null` arrives as
// `null`, and the resolvers map it to what the wrapper input takes.

export interface WbIdArgs {
    id: string;
}

export interface WbStoreWorkflowArgs {
    data: WorkflowValues;
    savedOn?: string | null;
}

export interface WbListReviewsArgs {
    list: ReviewListKind;
    where?: ReviewListWhere | null;
    sort?: ReviewListSort | null;
    limit?: number | null;
    after?: string | null;
}

export interface WbTargetReviewArgs {
    revisionId: string;
}

export interface WbRequestReviewArgs {
    /** `<pageId>#<version>`; the page id is parsed from it (R88). */
    revisionId: string;
    title?: string | null;
    picks?: ReviewPick[] | null;
}

export interface WbReviewArgs {
    reviewId: string;
}

export interface WbReviewStepArgs {
    reviewId: string;
    stepId: string;
}

export interface WbReviewStepCommentArgs extends WbReviewStepArgs {
    comment?: string | null;
}

export interface WbCancelReviewsForDeleteArgs {
    pageId: string;
    action: ReviewActiveOnTrashAction;
}
```

Create `packages/api-website-builder-workflows/src/graphql/isValidRevisionId.ts`:

```ts
/**
 * Whether a revision id is `<entryId>#<version>` with a non-empty entry id and a numeric version
 * of at least 1 (R107). Pure; the request resolver checks it before `parseIdentifier`, which
 * throws on some malformed ids and passes others through.
 */
export const isValidRevisionId = (revisionId: string): boolean => {
    const parts = revisionId.split("#");
    if (parts.length !== 2) {
        return false;
    }
    const [entryId, version] = parts;
    return entryId.length > 0 && /^\d+$/.test(version) && Number(version) >= 1;
};
```

- [ ] **Step 5: The schema factory**

Create `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`:

```ts
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/api-graphql";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import { ReviewValidationError } from "@webiny/api-workflows/domain/review/errors.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js";
import type {
    WbCancelReviewsForDeleteArgs,
    WbIdArgs,
    WbListReviewsArgs,
    WbRequestReviewArgs,
    WbReviewArgs,
    WbReviewStepArgs,
    WbReviewStepCommentArgs,
    WbStoreWorkflowArgs,
    WbTargetReviewArgs
} from "./types.js";
import { isValidRevisionId } from "./isValidRevisionId.js";

/**
 * Envelopes and root fields only; the `Workflows*` types come from api-workflows'
 * `WorkflowsSchemaFactory` (R100). `WbPageReviewListWhere` has no `modelId`: the WB list covers
 * `wb.page` only.
 */
const TYPE_DEFS = /* GraphQL */ `
    type WbPageWorkflowResponse {
        data: WorkflowsWorkflow
        error: WorkflowsError
    }

    type WbPageWorkflowListResponse {
        data: [WorkflowsWorkflow!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type WbPageReviewResponse {
        data: WorkflowsReview
        error: WorkflowsError
    }

    type WbPageReviewArrayResponse {
        data: [WorkflowsReview!]
        error: WorkflowsError
    }

    type WbPageReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type WbPageReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    input WbPageReviewListWhere {
        titleContains: String
        "My requests only (R91)."
        reviewState: WorkflowsReviewState
        "My requests only (R91)."
        stepState: WorkflowsStepState
    }

    extend type WbQuery {
        listWebsiteBuilderPageWorkflows: WbPageWorkflowListResponse!
        getWebsiteBuilderPageWorkflow(id: ID!): WbPageWorkflowResponse!
        getWebsiteBuilderPageReview(id: ID!): WbPageReviewWithFlagsResponse!
        "The active review of a page revision; data is null when it has none."
        getWebsiteBuilderPageTargetReview(revisionId: ID!): WbPageReviewWithFlagsResponse!
        listWebsiteBuilderPageReviews(
            list: WorkflowsReviewListKind!
            where: WbPageReviewListWhere
            sort: WorkflowsReviewListSort
            limit: Int
            after: String
        ): WbPageReviewListResponse!
    }

    extend type WbMutation {
        "savedOn: the value the editor loaded; omit when creating (D131, R104)."
        storeWebsiteBuilderPageWorkflow(
            data: WorkflowsWorkflowInput!
            savedOn: String
        ): WbPageWorkflowResponse!
        deleteWebsiteBuilderPageWorkflow(id: ID!): WbPageWorkflowResponse!
        requestWebsiteBuilderPageReview(
            revisionId: ID!
            title: String
            picks: [WorkflowsReviewPickInput!]
        ): WbPageReviewResponse!
        startWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!
        takeOverWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!
        approveWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): WbPageReviewResponse!
        rejectWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): WbPageReviewResponse!
        cancelWebsiteBuilderPageReview(reviewId: ID!): WbPageReviewResponse!
        "Cancels every in-progress review of the page before a trash or delete (D134)."
        cancelWebsiteBuilderPageReviewsForDelete(
            pageId: ID!
            action: WorkflowsReviewsForDeleteAction!
        ): WbPageReviewArrayResponse!
    }
`;

/**
 * Every Website Builder pages workflow and review operation on the `websiteBuilder` root of
 * `/graphql` (D136, R88). Each resolver calls one WB wrapper use case inline, which reads the
 * identity and checks permissions and page access (D132, D133); a failed Result keeps its code
 * and data (R100). Registered only with the `advancedPublishingWorkflow` license.
 */
class WebsiteBuilderWorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver({
            path: "WbQuery.listWebsiteBuilderPageWorkflows",
            dependencies: [ListWebsiteBuilderPageWorkflowsUseCase],
            resolver: (listWorkflows: ListWebsiteBuilderPageWorkflowsUseCase.Interface) => {
                return async () => {
                    const result = await listWorkflows.execute();
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value, { cursor: null, hasMoreItems: false });
                };
            }
        });

        builder.addResolver<WbIdArgs>({
            path: "WbQuery.getWebsiteBuilderPageWorkflow",
            dependencies: [GetWebsiteBuilderPageWorkflowUseCase],
            resolver: (getWorkflow: GetWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbIdArgs>({
            path: "WbQuery.getWebsiteBuilderPageReview",
            dependencies: [GetWebsiteBuilderPageReviewUseCase],
            resolver: (getReview: GetWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getReview.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbTargetReviewArgs>({
            path: "WbQuery.getWebsiteBuilderPageTargetReview",
            dependencies: [GetWebsiteBuilderPageTargetReviewUseCase],
            resolver: (getTargetReview: GetWebsiteBuilderPageTargetReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getTargetReview.execute({
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbListReviewsArgs>({
            path: "WbQuery.listWebsiteBuilderPageReviews",
            dependencies: [ListWebsiteBuilderPageReviewsUseCase],
            resolver: (listReviews: ListWebsiteBuilderPageReviewsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listReviews.execute({
                        list: args.list,
                        where: args.where,
                        sort: args.sort,
                        limit: args.limit,
                        after: args.after
                    });
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<WbStoreWorkflowArgs>({
            path: "WbMutation.storeWebsiteBuilderPageWorkflow",
            dependencies: [StoreWebsiteBuilderPageWorkflowUseCase],
            resolver: (storeWorkflow: StoreWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await storeWorkflow.execute({
                        workflow: args.data,
                        savedOn: args.savedOn ?? null
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbIdArgs>({
            path: "WbMutation.deleteWebsiteBuilderPageWorkflow",
            dependencies: [DeleteWebsiteBuilderPageWorkflowUseCase],
            resolver: (deleteWorkflow: DeleteWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbRequestReviewArgs>({
            path: "WbMutation.requestWebsiteBuilderPageReview",
            dependencies: [RequestWebsiteBuilderPageReviewUseCase],
            resolver: (requestReview: RequestWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await requestReview.execute({
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId,
                        title: args.title ?? null,
                        picks: args.picks ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbReviewStepArgs>({
            path: "WbMutation.startWebsiteBuilderPageReviewStep",
            dependencies: [StartWebsiteBuilderPageReviewStepUseCase],
            resolver: (startStep: StartWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await startStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbReviewStepArgs>({
            path: "WbMutation.takeOverWebsiteBuilderPageReviewStep",
            dependencies: [TakeOverWebsiteBuilderPageReviewStepUseCase],
            resolver: (takeOverStep: TakeOverWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await takeOverStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbReviewStepCommentArgs>({
            path: "WbMutation.approveWebsiteBuilderPageReviewStep",
            dependencies: [ApproveWebsiteBuilderPageReviewStepUseCase],
            resolver: (approveStep: ApproveWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await approveStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment ?? null
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbReviewStepCommentArgs>({
            path: "WbMutation.rejectWebsiteBuilderPageReviewStep",
            dependencies: [RejectWebsiteBuilderPageReviewStepUseCase],
            resolver: (rejectStep: RejectWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await rejectStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment ?? null
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbReviewArgs>({
            path: "WbMutation.cancelWebsiteBuilderPageReview",
            dependencies: [CancelWebsiteBuilderPageReviewUseCase],
            resolver: (cancelReview: CancelWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await cancelReview.execute({ reviewId: args.reviewId });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WbCancelReviewsForDeleteArgs>({
            path: "WbMutation.cancelWebsiteBuilderPageReviewsForDelete",
            dependencies: [CancelWebsiteBuilderPageReviewsForDeleteUseCase],
            resolver: (
                cancelForDelete: CancelWebsiteBuilderPageReviewsForDeleteUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const result = await cancelForDelete.execute({
                        targetId: args.pageId,
                        action: args.action
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const WebsiteBuilderWorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderWorkflowsSchemaFactoryImpl,
    dependencies: []
});
```

- [ ] **Step 6: `WbPage.system.workflow`**

In `packages/api-website-builder/src/graphql/pages/pages.typeDefs.ts`, insert before `type WbPage {`:

```graphql
    # Extended by api-website-builder-workflows with the stored system.workflow.
    type WbPageSystem {
        _empty: String
    }

```

and in `type WbPage`, replace `system: CmsEntrySystem` with `system: WbPageSystem`.

In `packages/api-website-builder/src/graphql/createGraphQL.ts`, add above `type CmsEntrySystem {` (inside the CMS base types comment block):

```graphql
    # `WbPage.system` uses its own `WbPageSystem` (pages.typeDefs.ts); this placeholder only keeps
    # the CMS base type set complete.
```

Replace `packages/api-website-builder-workflows/src/WebsiteBuilderPageSchemaFactory.ts` with:

```ts
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";

/**
 * `WbPage.system.workflow` on `/graphql` (R102): the stored `system.workflow` of a page revision
 * (spec 4.5). Website Builder's resolvers return the page with its `system`, so no resolver is
 * needed. Only registered with the advancedPublishingWorkflow license (WebsiteBuilderWorkflowsFeature
 * gates on the flag at register time), so no per-request license guard is needed here.
 */
class WebsiteBuilderPageSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type WbPageSystemWorkflow {
                workflowId: String
                reviewState: String
                stepId: String
                stepName: String
                stepState: String
            }

            extend type WbPageSystem {
                workflow: WbPageSystemWorkflow
            }
        `);

        return builder;
    }
}

export const WebsiteBuilderPageSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderPageSchemaFactoryImpl,
    dependencies: []
});
```

- [ ] **Step 7: Register the factory and add the dependency**

In `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`, add after the `WebsiteBuilderPageSchemaFactory` import:

```ts
import { WebsiteBuilderWorkflowsSchemaFactory } from "./graphql/WebsiteBuilderWorkflowsSchemaFactory.js";
```

and after `container.register(WebsiteBuilderPageSchemaFactory);`:

```ts
        // Every pages workflow and review operation on the `websiteBuilder` root (D136, R88).
        container.register(WebsiteBuilderWorkflowsSchemaFactory);
```

In `packages/api-website-builder-workflows/package.json`, add `"@webiny/utils": "0.0.0"` to `dependencies` after `"@webiny/feature": "0.0.0"` (for `parseIdentifier`, R88).

- [ ] **Step 8: Run the tests**

Run: `yarn > /dev/null 2>&1` (links the new dependency), then:

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (or "not run" recorded, A9).

Run: `yarn test packages/api-website-builder 2>&1 | tail -30`
Expected: PASS (`WbPage.system` changed type; nothing in that package selects it).

- [ ] **Step 9: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-website-builder-workflows|api-website-builder/" | head`
Expected: no output.

- [ ] **Step 10: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder` and `@webiny/api-website-builder-workflows` with `--no-cache`; `yarn adio` must accept `@webiny/utils`), then commit:

```
feat(api-website-builder-workflows): add the pages workflow and review GraphQL operations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
