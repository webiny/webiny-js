### Task 9: `CmsWorkflowsSchemaFactory` on `CmsQuery` / `CmsMutation`, corrected `system.workflow` type

Spec 10; D120, D133, D136; R46, R87, R88, R89, R90, R95, R96, R100, R101, R102 (A45), R104, R107, R108. Every Headless CMS workflow and review operation goes on the existing `cms` root of `/graphql` (`extend type CmsQuery` / `extend type CmsMutation`, the `compareEntryRevisions` precedent in `packages/ai-powerups/src/api/graphql/CmsCompareEntryRevisionsSchema.ts`). `CmsQuery` and `CmsMutation` come from `CoreGraphQLSchemaFactory` registrations in `packages/api-headless-cms/src/graphql/schema/cms/typeDefs/{query,mutation}.ts`; the composer runs every factory into one type document, so a `GraphQLSchemaFactory` may extend them and reference the shared `Workflows*` types of Task 6 (see Task 6, "How the `/graphql` schema is composed").

- One `GraphQLSchemaFactory`, `CmsWorkflowsSchemaFactory`, registered inside the license gate of `CmsWorkflowsFeature` (R100). It adds only the CMS envelopes and the root fields, and no inputs of its own (the pick input and delete action are Task 6's `WorkflowsReviewPickInput` / `WorkflowsReviewsForDeleteAction`, R100); everything else is a Task 6 type too (`WorkflowsError`, `WorkflowsListMeta`, `WorkflowsWorkflow`, `WorkflowsWorkflowInput`, `WorkflowsReview`, `WorkflowsReviewWithFlags`, `WorkflowsReviewListKind`, `WorkflowsReviewListSort`, `WorkflowsReviewListWhere` with its CMS-only `modelId`).
- Each resolver resolves one wrapper through `dependencies` (per request, from `context.container`) and calls it inline. Argument mapping is pure only (R88): `toCmsNamespace(modelId)` and `parseIdentifier(revisionId).id` for the request, after the pure `isValidRevisionId` check (R107: a malformed id returns `new ErrorResponse(new ReviewValidationError("The revision id is not valid."))`, never a thrown error); `toCmsNamespace(modelId)` for the target review and the cancel-for-delete. A failed Result becomes `new ErrorResponse(result.error)` / `new ListErrorResponse(result.error)` (code, message and data kept); a thrown error is a wrapper bug and is not caught (R100).
- Input dates are `String` (`savedOn`, R104).
- R102: the legacy `CmsEntrySystemWorkflow` type on the CMS endpoints becomes the stored shape `{ workflowId, reviewState, stepId, stepName, stepState }`, and a test reads a stored `system.workflow` through `/cms/manage`. The old admin's entry field selections that select `state` stay broken (A45: accepted, no admin package changes in phase 3).
- Dependencies: `@webiny/api-graphql` and `@webiny/utils` (`parseIdentifier`), both allowed by R101.
- Test harness: `createContextHandler` returns `handler`, `invoke`, `invokeCms`, `createQuery`, `createMutation` and `introspect` next to `context` (the Task 6 pattern); `createGraphQLClient` builds a client as one identity with the fixed teams and the fake FLP.

**Files:**
- Modify: `packages/api-headless-cms-workflows/package.json`
- Create: `packages/api-headless-cms-workflows/src/graphql/isValidRevisionId.ts`
- Create: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Modify: `packages/api-headless-cms-workflows/src/graphql/entrySystemSchema.ts`
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/testContext.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/graphql.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/entrySystemSchema.test.ts`

**Interfaces:**
- Consumes:
  - Task 6 shared SDL (types above, plus `input WorkflowsReviewPickInput { stepId: String! userId: String! }` and `enum WorkflowsReviewsForDeleteAction { trash delete }`) and its rule that `WorkflowsReviewStep.assignments` is `null` unless the wrapper attached records.
  - Wrappers (phase 2 and Tasks 7, 8): `ListCmsEntryWorkflowsUseCase.execute()`, `GetCmsEntryWorkflowUseCase.execute({ id })`, `StoreCmsEntryWorkflowUseCase.execute({ workflow, savedOn })`, `DeleteCmsEntryWorkflowUseCase.execute({ id })`, `GetCmsEntryReviewUseCase.execute({ id })`, `GetCmsEntryTargetReviewUseCase.execute({ model, targetRevisionId })`, `ListCmsEntryReviewsUseCase.execute(ListCmsEntryReviewsInput)`, `ListCmsEntryWorkflowModelsUseCase.execute(ListCmsEntryWorkflowModelsInput)`, `RequestCmsEntryReviewUseCase.execute({ model, targetId, targetRevisionId, title, picks })`, `StartCmsEntryReviewStepUseCase` / `TakeOverCmsEntryReviewStepUseCase` (`{ reviewId, stepId }`), `ApproveCmsEntryReviewStepUseCase` / `RejectCmsEntryReviewStepUseCase` (`{ reviewId, stepId, comment? }`), `CancelCmsEntryReviewUseCase` (`{ reviewId }`), `CancelCmsEntryReviewsForDeleteUseCase` (`{ model, targetId, targetRevisionId?, action }`, returns `ReviewData[]`).
  - `GraphQLSchemaFactory` (`@webiny/api-graphql/graphql/abstractions.js`); `Response`, `ErrorResponse`, `ListResponse`, `ListErrorResponse` (`@webiny/api-graphql`); `parseIdentifier` (`@webiny/utils`); `ReviewValidationError` (`@webiny/api-workflows/domain/review/errors.js`, message only, no data); `toCmsNamespace` (`~/utils/appName.js`); `ReviewPick` (`@webiny/api-workflows/domain/review/types.js`); `ReviewActiveOnTrashAction` (`@webiny/api-workflows/domain/review/errors.js`); `WorkflowValues` (`@webiny/api-workflows/domain/workflow/types.js`).
  - R90 message (3.1 Task 2): "A rejection needs a comment of at least 10 characters."; R89 message: "The review title must have at least 5 characters."
- Produces:
  - `CmsWorkflowsSchemaFactory` (`src/graphql/CmsWorkflowsSchemaFactory.ts`), not exported from the barrel.
  - `isValidRevisionId(revisionId: string): boolean` (`src/graphql/isValidRevisionId.ts`, pure, R107; the WB package has its own copy, inline duplication intended).
  - CMS GraphQL types: `CmsEntryWorkflowResponse`, `CmsEntryWorkflowListResponse`, `CmsEntryReviewResponse`, `CmsEntryReviewArrayResponse`, `CmsEntryReviewWithFlagsResponse`, `CmsEntryReviewListResponse`, `CmsEntryWorkflowModelWorkflow`, `CmsEntryWorkflowModel`, `CmsEntryWorkflowModelListResponse`.
  - Root fields exactly as R88 (`CmsQuery`: `listCmsEntryWorkflows`, `getCmsEntryWorkflow`, `getCmsEntryReview`, `getCmsEntryTargetReview`, `listCmsEntryReviews`, `listCmsEntryWorkflowModels`; `CmsMutation`: `storeCmsEntryWorkflow`, `deleteCmsEntryWorkflow`, `requestCmsEntryReview`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep`, `cancelCmsEntryReview`, `cancelCmsEntryReviewsForDelete`).
  - `CmsEntrySystemWorkflow { workflowId: String reviewState: String stepId: String stepName: String stepState: String }` on the CMS endpoints.
  - Test harness: `createContextHandler` returns `{ identity, tenant, opensearch, handler, context, invoke, invokeCms, createQuery, createMutation, introspect }`; `TEST_TEAMS` exported from `__tests__/__helpers/testContext.ts`; `createGraphQLClient(params?: GraphQLClientParams): GraphQLClient` in `__tests__/__helpers/graphql.ts`.

- [ ] **Step 1: Dependencies and the test harness**

In `packages/api-headless-cms-workflows/package.json`, set `dependencies` to:

```json
  "dependencies": {
    "@webiny/api-aco": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/api-graphql": "0.0.0",
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-headless-cms-tasks": "0.0.0",
    "@webiny/api-workflows": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
```

Run: `yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio`
Expected: `adio` passes; `packages/api-headless-cms-workflows/tsconfig.json` gains the `api-graphql` and `utils` references and paths.

Replace `packages/api-headless-cms-workflows/__tests__/__handler/context.ts` with:

```ts
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "~/index.js";

const registerNoopFlp = createRegisterExtensionPlugin(context => {
    context.container.register(NoopFolderLevelPermissions);
});

export const createContextHandler = (
    params?: CmsTestHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    const handler = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createModelsPlugins(params),
            registerNoopFlp,
            params?.legacyPlugins || []
        ],
        // Mirror the production stack (registerApiRequestStack.ts): core workflows first, then the
        // CMS integration.
        setup: container => {
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
        },
        testProjectLicense: params?.testProjectLicense ?? testLicence
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        opensearch: createTestOpenSearchClient(),
        handler,
        /** `getContext()` is `Record<string, any>` unless typed; the tests read the CMS context. */
        context: () => handler.getContext<CmsContext>(),
        /** The main `/graphql` endpoint (the `cms` root lives there). */
        invoke: handler.invoke,
        /** The CMS endpoints (`/cms/manage` by default). */
        invokeCms: handler.invokeCms,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/testContext.ts`, export the team map (other test helpers build the same teams) by replacing

```ts
const TEAMS: Record<string, string[]> = {
```

with

```ts
export const TEST_TEAMS: Record<string, string[]> = {
```

and `new FakeListUserTeams(TEAMS)` with `new FakeListUserTeams(TEST_TEAMS)`.

Create `packages/api-headless-cms-workflows/__tests__/__helpers/graphql.ts`:

```ts
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { TEST_TEAMS } from "./testContext.js";

export interface GraphQLClientParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    testProjectLicense?: DecryptedWcpProjectLicense;
    legacyPlugins?: unknown[];
}

export interface GraphQLResponseError {
    message: string;
}

export interface GraphQLResponseBody {
    data: any;
    errors?: GraphQLResponseError[];
}

export type GraphQLClient = (
    query: string,
    variables?: Record<string, unknown>
) => Promise<GraphQLResponseBody>;

/**
 * Sends `/graphql` requests as one identity, with the fixed teams and the fake FLP (A28), like
 * `createUserContext`. Data persists across handlers within one test (A32): set up through a
 * context, then call GraphQL as another user.
 */
export const createGraphQLClient = (params: GraphQLClientParams = {}): GraphQLClient => {
    const { invoke } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        testProjectLicense: params.testProjectLicense,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEST_TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
    return async (query, variables) => {
        const [body] = await invoke({ body: { query, variables } });
        return body as GraphQLResponseBody;
    };
};
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REQUESTER,
    REVIEWER
} from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    CMS_WRITER,
    WORKFLOWS_EDITOR
} from "~tests/__helpers/permissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";

const ERROR = "error { code message data }";
const META = "meta { cursor hasMoreItems }";
const WORKFLOW = "id name models savedOn";
const REVIEW =
    "id title model targetId targetRevisionId state currentStepState currentOwnerId";

const LIST_WORKFLOWS = /* GraphQL */ `
    query ListWorkflows {
        cms {
            listCmsEntryWorkflows {
                data { ${WORKFLOW} }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const GET_WORKFLOW = /* GraphQL */ `
    query GetWorkflow($id: ID!) {
        cms {
            getCmsEntryWorkflow(id: $id) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const DELETE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWorkflow($id: ID!) {
        cms {
            deleteCmsEntryWorkflow(id: $id) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    review {
                        ${REVIEW}
                        steps { id description assignments { kind source userId } }
                    }
                    flags { canStart canCancel }
                }
                ${ERROR}
            }
        }
    }
`;

const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data {
                    review { ${REVIEW} }
                    flags { canStart canCancel }
                }
                ${ERROR}
            }
        }
    }
`;

const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews(
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
                    review { ${REVIEW} }
                    flags { canStart canCancel }
                }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const LIST_MODELS = /* GraphQL */ `
    query ListModels($search: String, $limit: Int, $after: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after) {
                data { model modelId name workflow { id name } }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview(
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
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const START_STEP = /* GraphQL */ `
    mutation StartStep($reviewId: ID!, $stepId: ID!) {
        cms {
            startCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!) {
        cms {
            takeOverCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const APPROVE_STEP = /* GraphQL */ `
    mutation ApproveStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            approveCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REJECT_STEP = /* GraphQL */ `
    mutation RejectStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            rejectCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete(
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
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

/**
 * Admin stores the workflow, creates "Ann" (reviewed by REQUESTER), "Bob" (no review) and
 * "Locked" (reviewed by REQUESTER, in "folder-locked").
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const unreviewedEntry = await createAuthorEntry(admin, { name: "Bob" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, unreviewedEntry, lockedEntry, review, lockedReview };
};

describe("CMS workflows GraphQL", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("stores, reads, lists and deletes a workflow as an editor", async () => {
        await createUserContext();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });

        const stored = await run(editor, STORE_WORKFLOW, { data: createWorkflowValues() });
        const updated = await run(editor, STORE_WORKFLOW, {
            data: { ...createWorkflowValues(), name: "Renamed" },
            savedOn: stored.storeCmsEntryWorkflow.data.savedOn
        });
        const read = await run(editor, GET_WORKFLOW, { id: "workflow-1" });
        const listed = await run(editor, LIST_WORKFLOWS);
        const deleted = await run(editor, DELETE_WORKFLOW, { id: "workflow-1" });
        const afterDelete = await run(editor, GET_WORKFLOW, { id: "workflow-1" });

        expect(stored.storeCmsEntryWorkflow.error).toBeNull();
        expect(stored.storeCmsEntryWorkflow.data).toMatchObject({
            id: "workflow-1",
            name: "Test Workflow",
            models: ["cms.author"]
        });
        expect(updated.storeCmsEntryWorkflow.data.name).toBe("Renamed");
        expect(read.getCmsEntryWorkflow.data.name).toBe("Renamed");
        expect(listed.listCmsEntryWorkflows.data.map((row: { id: string }) => row.id)).toEqual([
            "workflow-1"
        ]);
        expect(listed.listCmsEntryWorkflows.meta).toEqual({ cursor: null, hasMoreItems: false });
        expect(deleted.deleteCmsEntryWorkflow.data.id).toBe("workflow-1");
        expect(afterDelete.getCmsEntryWorkflow.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("returns the workflow errors with code and data", async () => {
        await createUserContext();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const refused = await run(reader, STORE_WORKFLOW, { data: createWorkflowValues() });
        const missing = await run(editor, GET_WORKFLOW, { id: "missing-workflow" });
        await run(editor, STORE_WORKFLOW, { data: createWorkflowValues() });
        const stale = await run(editor, STORE_WORKFLOW, {
            data: createWorkflowValues(),
            savedOn: "2000-01-01T00:00:00.000Z"
        });

        expect(refused.storeCmsEntryWorkflow).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to manage workflows.",
                data: { action: "manage workflows" }
            }
        });
        expect(missing.getCmsEntryWorkflow.data).toBeNull();
        expect(missing.getCmsEntryWorkflow.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "missing-workflow" }
        });
        expect(stale.storeCmsEntryWorkflow.error.code).toBe("Workflows/Workflow/Conflict");
        expect(stale.storeCmsEntryWorkflow.error.data).toEqual(
            expect.objectContaining({ savedOn: expect.any(String) })
        );
    });

    it("requests a review from the model id and the revision id, with a title (R88, R89)", async () => {
        const { unreviewedEntry } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await run(requester, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id,
            title: "Spring launch"
        });

        expect(result.requestCmsEntryReview.error).toBeNull();
        expect(result.requestCmsEntryReview.data).toMatchObject({
            title: "Spring launch",
            model: "cms.author",
            targetId: unreviewedEntry.entryId,
            targetRevisionId: unreviewedEntry.id,
            state: "inProgress"
        });
    });

    it("returns the request validation and authorization errors", async () => {
        const { unreviewedEntry } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const shortTitle = await run(requester, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id,
            title: "abc"
        });
        const refused = await run(reader, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id
        });

        expect(shortTitle.requestCmsEntryReview.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "The review title must have at least 5 characters."
        });
        expect(refused.requestCmsEntryReview.error).toEqual({
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to request a review.",
            data: { action: "request a review" }
        });
    });

    it("reads a review by id and by revision with the viewer's flags", async () => {
        const { entry, unreviewedEntry, review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const byId = await run(reviewer, GET_REVIEW, { id: review.id });
        const byRevision = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: entry.id
        });
        const none = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id
        });

        expect(byId.getCmsEntryReview.data.review.id).toBe(review.id);
        expect(byId.getCmsEntryReview.data.review.steps[0].description).toBe("This is step 1");
        expect(byId.getCmsEntryReview.data.flags).toEqual({ canStart: true, canCancel: false });
        expect(byRevision.getCmsEntryTargetReview.data.review.id).toBe(review.id);
        expect(none.getCmsEntryTargetReview).toEqual({ data: null, error: null });
    });

    it("returns the target review refusal with code and data", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: lockedEntry.id
        });

        expect(result.getCmsEntryTargetReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view this review.",
                data: { action: "view this review" }
            }
        });
    });

    it("returns NotAuthorized for a revision that does not exist (R108)", async () => {
        await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: "missing#0001"
        });

        expect(result.getCmsEntryTargetReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view this review.",
                data: { action: "view this review" }
            }
        });
    });

    it("returns the revision id validation error for a malformed revision id (R107)", async () => {
        await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        for (const revisionId of ["#0001", "abc", "abc#x"]) {
            const result = await run(requester, REQUEST_REVIEW, { modelId: "author", revisionId });

            expect(result.requestCmsEntryReview).toEqual({
                data: null,
                error: {
                    code: "Workflows/Review/Validation",
                    message: "The revision id is not valid.",
                    data: null
                }
            });
        }
    });

    it("reports a review of another app as not found (R46)", async () => {
        await createScenario();
        const wbReview = await createWbReview();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_REVIEW, { id: wbReview.id });

        expect(result.getCmsEntryReview.data).toBeNull();
        expect(result.getCmsEntryReview.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
    });

    it("drops skip entries from the review read for a plain reviewer through GraphQL (R96)", async () => {
        const { admin, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(result.getCmsEntryReview.data.review.steps).toEqual([
            {
                id: STEP_ID,
                description: "This is step 1",
                assignments: [{ kind: "outcome", source: "pool", userId: null }]
            }
        ]);
    });

    it("lists only CMS reviews", async () => {
        const { review, lockedReview } = await createScenario();
        await createWbReview();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await run(requester, LIST_REVIEWS, { list: "myRequests" });

        const rows = result.listCmsEntryReviews.data;
        expect(rows.map((row: { review: { model: string } }) => row.review.model)).toEqual([
            "cms.author",
            "cms.author"
        ]);
        expect(rows.map((row: { review: { id: string } }) => row.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(result.listCmsEntryReviews.meta).toEqual({ cursor: null, hasMoreItems: false });
        expect(result.listCmsEntryReviews.error).toBeNull();
    });

    it("filters and pages the review list", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const filtered = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            where: { modelId: "author", titleContains: "Lock" }
        });
        const first = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC",
            limit: 1
        });
        const second = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC",
            limit: 1,
            after: first.listCmsEntryReviews.meta.cursor
        });

        expect(
            filtered.listCmsEntryReviews.data.map((row: { review: { id: string } }) => row.review.id)
        ).toEqual([lockedReview.id]);
        expect(first.listCmsEntryReviews.meta.hasMoreItems).toBe(true);
        expect(
            [...first.listCmsEntryReviews.data, ...second.listCmsEntryReviews.data]
                .map((row: { review: { id: string } }) => row.review.id)
                .sort()
        ).toEqual([review.id, lockedReview.id].sort());
    });

    it("returns the failed steps refusal with code, data and no meta (R95)", async () => {
        await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, LIST_REVIEWS, { list: "failedSteps" });

        expect(result.listCmsEntryReviews).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list failed steps.",
                data: { action: "list failed steps" }
            }
        });
    });

    it("starts, takes over and approves a step", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const otherReviewer = createGraphQLClient({
            identity: OTHER_REVIEWER,
            permissions: CMS_READER
        });
        const step = { reviewId: review.id, stepId: STEP_ID };

        const started = await run(reviewer, START_STEP, step);
        const takenOver = await run(otherReviewer, TAKE_OVER_STEP, step);
        const approved = await run(otherReviewer, APPROVE_STEP, { ...step, comment: null });

        expect(started.startCmsEntryReviewStep.data).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: REVIEWER.id
        });
        expect(takenOver.takeOverCmsEntryReviewStep.data.currentOwnerId).toBe(OTHER_REVIEWER.id);
        expect(approved.approveCmsEntryReviewStep.data.state).toBe("approved");
    });

    it("rejects a step only with a comment of at least 10 characters (R90)", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const step = { reviewId: review.id, stepId: STEP_ID };
        await run(reviewer, START_STEP, step);

        const tooShort = await run(reviewer, REJECT_STEP, { ...step, comment: "  No.  " });
        const rejected = await run(reviewer, REJECT_STEP, {
            ...step,
            comment: "Needs another pass."
        });

        expect(tooShort.rejectCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "A rejection needs a comment of at least 10 characters."
        });
        expect(rejected.rejectCmsEntryReviewStep.data.state).toBe("rejected");
    });

    it("returns Workflows/NotAuthorized with data through GraphQL", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const refused = await run(reviewer, CANCEL_REVIEW, { reviewId: review.id });
        const cancelled = await run(requester, CANCEL_REVIEW, { reviewId: review.id });

        expect(refused.cancelCmsEntryReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to cancel a review requested by someone else.",
                data: { action: "cancel a review requested by someone else" }
            }
        });
        expect(cancelled.cancelCmsEntryReview.data.state).toBe("cancelled");
    });

    it("cancels the reviews of an entry before it is trashed (D134)", async () => {
        const { entry, review } = await createScenario();
        const admin = createGraphQLClient();

        const result = await run(admin, CANCEL_REVIEWS_FOR_DELETE, {
            modelId: "author",
            entryId: entry.entryId,
            action: "trash"
        });

        expect(result.cancelCmsEntryReviewsForDelete.error).toBeNull();
        expect(result.cancelCmsEntryReviewsForDelete.data).toEqual([
            expect.objectContaining({ id: review.id, state: "cancelled" })
        ]);
    });

    it("lists the bindable models for an editor and refuses everyone else (D116)", async () => {
        await createScenario();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const listed = await run(editor, LIST_MODELS, { search: "auth" });
        const refused = await run(reader, LIST_MODELS);

        expect(listed.listCmsEntryWorkflowModels.data).toEqual([
            {
                model: "cms.author",
                modelId: "author",
                name: "Author",
                workflow: { id: "workflow-1", name: "Test Workflow" }
            }
        ]);
        expect(listed.listCmsEntryWorkflowModels.meta).toEqual({
            cursor: null,
            hasMoreItems: false
        });
        expect(refused.listCmsEntryWorkflowModels).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to manage workflows.",
                data: { action: "manage workflows" }
            }
        });
    });

    it("returns the anonymous refusal with its code", async () => {
        await createScenario();
        const anonymous = createGraphQLClient({ identity: null, permissions: [] });

        const result = await run(anonymous, LIST_REVIEWS, { list: "pool" });

        expect(result.listCmsEntryReviews.error.code).toBe("Workflows/NotAuthenticated");
        expect(result.listCmsEntryReviews.data).toBeNull();
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";

const ROOT_FIELDS = /* GraphQL */ `
    {
        query: __type(name: "CmsQuery") {
            fields {
                name
            }
        }
        mutation: __type(name: "CmsMutation") {
            fields {
                name
            }
        }
        envelope: __type(name: "CmsEntryReviewListResponse") {
            name
        }
    }
`;

const CMS_QUERY_FIELDS = [
    "listCmsEntryWorkflows",
    "getCmsEntryWorkflow",
    "getCmsEntryReview",
    "getCmsEntryTargetReview",
    "listCmsEntryReviews",
    "listCmsEntryWorkflowModels"
];

const CMS_MUTATION_FIELDS = [
    "storeCmsEntryWorkflow",
    "deleteCmsEntryWorkflow",
    "requestCmsEntryReview",
    "startCmsEntryReviewStep",
    "takeOverCmsEntryReviewStep",
    "approveCmsEntryReviewStep",
    "rejectCmsEntryReviewStep",
    "cancelCmsEntryReview",
    "cancelCmsEntryReviewsForDelete"
];

interface NamedRow {
    name: string;
}

const names = (rows: NamedRow[] | undefined): string[] => {
    return (rows ?? []).map(row => row.name);
};

describe("CMS workflows GraphQL and the license", () => {
    it("adds every CMS operation with the advancedPublishingWorkflow license (R88)", async () => {
        const client = createGraphQLClient();

        const body = await client(ROOT_FIELDS);

        expect(names(body.data.query.fields)).toEqual(expect.arrayContaining(CMS_QUERY_FIELDS));
        expect(names(body.data.mutation.fields)).toEqual(
            expect.arrayContaining(CMS_MUTATION_FIELDS)
        );
        expect(body.data.envelope).toEqual({ name: "CmsEntryReviewListResponse" });
    });

    it("adds nothing without the advancedPublishingWorkflow license (R100)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const client = createGraphQLClient({ testProjectLicense: license });

        const body = await client(ROOT_FIELDS);

        expect(body.errors).toBeUndefined();
        for (const field of CMS_QUERY_FIELDS) {
            expect(names(body.data.query.fields)).not.toContain(field);
        }
        for (const field of CMS_MUTATION_FIELDS) {
            expect(names(body.data.mutation.fields)).not.toContain(field);
        }
        expect(body.data.envelope).toBeNull();
    });
});
```

Replace `packages/api-headless-cms-workflows/__tests__/entrySystemSchema.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createContextHandler } from "~tests/__handler/context.js";

const CMS_ENTRY_SYSTEM_WORKFLOW_FIELDS = /* GraphQL */ `
    {
        __type(name: "CmsEntrySystemWorkflow") {
            fields {
                name
            }
        }
    }
`;

const GET_AUTHOR_SYSTEM = /* GraphQL */ `
    query GetAuthor($revision: ID!) {
        getAuthor(revision: $revision) {
            data {
                id
                meta {
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
            }
            error {
                code
                message
            }
        }
    }
`;

interface NamedRow {
    name: string;
}

describe("CmsEntrySystem workflow field (R102)", () => {
    it("has the stored shape on the CMS manage endpoint", async () => {
        const { invokeCms } = createContextHandler();

        const [body] = await invokeCms({ body: { query: CMS_ENTRY_SYSTEM_WORKFLOW_FIELDS } });

        const fieldNames = (body.data.__type.fields as NamedRow[]).map(field => field.name);
        expect(fieldNames).toEqual(["workflowId", "reviewState", "stepId", "stepName", "stepState"]);
    });

    it("reads a stored system.workflow through /cms/manage", async () => {
        const { context, invokeCms } = createContextHandler();
        const admin = await context();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        await requestEntryReview(admin, entry);

        const [body] = await invokeCms({
            body: { query: GET_AUTHOR_SYSTEM, variables: { revision: entry.id } }
        });

        expect(body.errors).toBeUndefined();
        expect(body.data.getAuthor.error).toBeNull();
        expect(body.data.getAuthor.data.meta.system.workflow).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: "step-1",
            stepName: "Step 1",
            stepState: "awaiting"
        });
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql packages/api-headless-cms-workflows/__tests__/entrySystemSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. The schema tests get GraphQL errors (`Cannot query field "listCmsEntryWorkflows" on type "CmsQuery"` and the same for every other operation); the first license test misses the fields; the system test lists `stepId`, `state` instead of the stored shape and the stored value fails with `Cannot query field "reviewState" on type "CmsEntrySystemWorkflow"`. The second license test passes already.

- [ ] **Step 4: The corrected `system.workflow` type (R102)**

Replace `packages/api-headless-cms-workflows/src/graphql/entrySystemSchema.ts` with:

```ts
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins/index.js";

/**
 * `system.workflow` of a CMS entry on the CMS endpoints, in the stored shape
 * (`ReviewSystemWorkflow`, spec 4.5, R102).
 */
export const createEntrySystemSchemaExtension = () => {
    return new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsEntrySystemWorkflow {
                workflowId: String
                reviewState: String
                stepId: String
                stepName: String
                stepState: String
            }

            extend type CmsEntrySystem {
                workflow: CmsEntrySystemWorkflow
            }
        `
    });
};
```

- [ ] **Step 5: The schema factory**

Create `packages/api-headless-cms-workflows/src/graphql/isValidRevisionId.ts`:

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

Create `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`:

```ts
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/api-graphql";
import { parseIdentifier } from "@webiny/utils";
import type { ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import {
    ReviewValidationError,
    type ReviewActiveOnTrashAction
} from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isValidRevisionId } from "./isValidRevisionId.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";

interface StoreCmsEntryWorkflowArgs {
    data: WorkflowValues;
    /** The `savedOn` the editor loaded (D131); a string, not `DateTime` (R104). */
    savedOn?: string | null;
}

interface GetCmsEntryTargetReviewArgs {
    modelId: string;
    revisionId: string;
}

interface RequestCmsEntryReviewArgs {
    modelId: string;
    revisionId: string;
    title?: string | null;
    picks?: ReviewPick[] | null;
}

interface CancelCmsEntryReviewsForDeleteArgs {
    modelId: string;
    entryId: string;
    revisionId?: string | null;
    action: ReviewActiveOnTrashAction;
}

/**
 * CMS envelopes, inputs and root fields. Every other type is a shared `Workflows*` type of the
 * api-workflows schema (R100), built into the same `/graphql` document.
 */
const CMS_WORKFLOWS_TYPE_DEFS = /* GraphQL */ `
    type CmsEntryWorkflowResponse {
        data: WorkflowsWorkflow
        error: WorkflowsError
    }

    type CmsEntryWorkflowListResponse {
        data: [WorkflowsWorkflow!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryReviewResponse {
        data: WorkflowsReview
        error: WorkflowsError
    }

    type CmsEntryReviewArrayResponse {
        data: [WorkflowsReview!]
        error: WorkflowsError
    }

    type CmsEntryReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type CmsEntryReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryWorkflowModelWorkflow {
        id: ID!
        name: String!
    }

    type CmsEntryWorkflowModel {
        "Namespace id, cms.<modelId>, as a workflow's models hold it."
        model: String!
        modelId: ID!
        name: String!
        workflow: CmsEntryWorkflowModelWorkflow
    }

    type CmsEntryWorkflowModelListResponse {
        data: [CmsEntryWorkflowModel!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    extend type CmsQuery {
        listCmsEntryWorkflows: CmsEntryWorkflowListResponse!
        getCmsEntryWorkflow(id: ID!): CmsEntryWorkflowResponse!
        getCmsEntryReview(id: ID!): CmsEntryReviewWithFlagsResponse!
        getCmsEntryTargetReview(modelId: ID!, revisionId: ID!): CmsEntryReviewWithFlagsResponse!
        listCmsEntryReviews(
            list: WorkflowsReviewListKind!
            where: WorkflowsReviewListWhere
            sort: WorkflowsReviewListSort
            limit: Int
            after: String
        ): CmsEntryReviewListResponse!
        listCmsEntryWorkflowModels(
            search: String
            limit: Int
            after: String
        ): CmsEntryWorkflowModelListResponse!
    }

    extend type CmsMutation {
        storeCmsEntryWorkflow(
            data: WorkflowsWorkflowInput!
            savedOn: String
        ): CmsEntryWorkflowResponse!
        deleteCmsEntryWorkflow(id: ID!): CmsEntryWorkflowResponse!
        requestCmsEntryReview(
            modelId: ID!
            revisionId: ID!
            title: String
            picks: [WorkflowsReviewPickInput!]
        ): CmsEntryReviewResponse!
        startCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!
        takeOverCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!
        approveCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): CmsEntryReviewResponse!
        rejectCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): CmsEntryReviewResponse!
        cancelCmsEntryReview(reviewId: ID!): CmsEntryReviewResponse!
        cancelCmsEntryReviewsForDelete(
            modelId: ID!
            entryId: ID!
            revisionId: ID
            action: WorkflowsReviewsForDeleteAction!
        ): CmsEntryReviewArrayResponse!
    }
`;

/**
 * Headless CMS workflow and review operations on the `cms` root of `/graphql` (R88, D136). Each
 * resolver calls its wrapper use case inline (D132); the wrappers check identity, permissions and
 * target access. Registered only with the `advancedPublishingWorkflow` license (R100).
 */
class CmsWorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(CMS_WORKFLOWS_TYPE_DEFS);

        // Workflows
        builder.addResolver({
            path: "CmsQuery.listCmsEntryWorkflows",
            dependencies: [ListCmsEntryWorkflowsUseCase],
            resolver: (listWorkflows: ListCmsEntryWorkflowsUseCase.Interface) => {
                return async () => {
                    const result = await listWorkflows.execute();
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    // Unpaged (R59): one page with every CMS workflow.
                    return new ListResponse(result.value, { cursor: null, hasMoreItems: false });
                };
            }
        });

        builder.addResolver<GetCmsEntryWorkflowUseCase.Input>({
            path: "CmsQuery.getCmsEntryWorkflow",
            dependencies: [GetCmsEntryWorkflowUseCase],
            resolver: (getWorkflow: GetCmsEntryWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StoreCmsEntryWorkflowArgs>({
            path: "CmsMutation.storeCmsEntryWorkflow",
            dependencies: [StoreCmsEntryWorkflowUseCase],
            resolver: (storeWorkflow: StoreCmsEntryWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await storeWorkflow.execute({
                        workflow: args.data,
                        savedOn: args.savedOn
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<DeleteCmsEntryWorkflowUseCase.Input>({
            path: "CmsMutation.deleteCmsEntryWorkflow",
            dependencies: [DeleteCmsEntryWorkflowUseCase],
            resolver: (deleteWorkflow: DeleteCmsEntryWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryWorkflowModelsUseCase.Input>({
            path: "CmsQuery.listCmsEntryWorkflowModels",
            dependencies: [ListCmsEntryWorkflowModelsUseCase],
            resolver: (listModels: ListCmsEntryWorkflowModelsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listModels.execute({
                        search: args.search,
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

        // Review reads
        builder.addResolver<GetCmsEntryReviewUseCase.Input>({
            path: "CmsQuery.getCmsEntryReview",
            dependencies: [GetCmsEntryReviewUseCase],
            resolver: (getReview: GetCmsEntryReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getReview.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetCmsEntryTargetReviewArgs>({
            path: "CmsQuery.getCmsEntryTargetReview",
            dependencies: [GetCmsEntryTargetReviewUseCase],
            resolver: (getTargetReview: GetCmsEntryTargetReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getTargetReview.execute({
                        model: toCmsNamespace(args.modelId),
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryReviewsUseCase.Input>({
            path: "CmsQuery.listCmsEntryReviews",
            dependencies: [ListCmsEntryReviewsUseCase],
            resolver: (listReviews: ListCmsEntryReviewsUseCase.Interface) => {
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

        // Review actions
        builder.addResolver<RequestCmsEntryReviewArgs>({
            path: "CmsMutation.requestCmsEntryReview",
            dependencies: [RequestCmsEntryReviewUseCase],
            resolver: (requestReview: RequestCmsEntryReviewUseCase.Interface) => {
                return async ({ args }) => {
                    // The entry id comes from the revision id, `<entryId>#<version>` (R88); a
                    // malformed one is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await requestReview.execute({
                        model: toCmsNamespace(args.modelId),
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId,
                        title: args.title,
                        picks: args.picks ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StartCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.startCmsEntryReviewStep",
            dependencies: [StartCmsEntryReviewStepUseCase],
            resolver: (startStep: StartCmsEntryReviewStepUseCase.Interface) => {
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

        builder.addResolver<TakeOverCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.takeOverCmsEntryReviewStep",
            dependencies: [TakeOverCmsEntryReviewStepUseCase],
            resolver: (takeOverStep: TakeOverCmsEntryReviewStepUseCase.Interface) => {
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

        builder.addResolver<ApproveCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.approveCmsEntryReviewStep",
            dependencies: [ApproveCmsEntryReviewStepUseCase],
            resolver: (approveStep: ApproveCmsEntryReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await approveStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<RejectCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.rejectCmsEntryReviewStep",
            dependencies: [RejectCmsEntryReviewStepUseCase],
            resolver: (rejectStep: RejectCmsEntryReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await rejectStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelCmsEntryReviewUseCase.Input>({
            path: "CmsMutation.cancelCmsEntryReview",
            dependencies: [CancelCmsEntryReviewUseCase],
            resolver: (cancelReview: CancelCmsEntryReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await cancelReview.execute({ reviewId: args.reviewId });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelCmsEntryReviewsForDeleteArgs>({
            path: "CmsMutation.cancelCmsEntryReviewsForDelete",
            dependencies: [CancelCmsEntryReviewsForDeleteUseCase],
            resolver: (cancelForDelete: CancelCmsEntryReviewsForDeleteUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await cancelForDelete.execute({
                        model: toCmsNamespace(args.modelId),
                        targetId: args.entryId,
                        targetRevisionId: args.revisionId,
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

export const CmsWorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: CmsWorkflowsSchemaFactoryImpl,
    dependencies: []
});
```

- [ ] **Step 6: Register**

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`, add the import after the `createEntrySystemSchemaExtension` import:

```ts
import { CmsWorkflowsSchemaFactory } from "./graphql/CmsWorkflowsSchemaFactory.js";
```

and register it after `CmsWrappersFeature.register(container);`:

```ts

        // Every CMS workflow and review operation on the `cms` root of `/graphql` (R88).
        container.register(CmsWorkflowsSchemaFactory);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql packages/api-headless-cms-workflows/__tests__/entrySystemSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (the harness change keeps every existing test green).

Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (it registers `CmsWorkflowsFeature` too, so its `/graphql` schema now carries the CMS operations).

Run: `yarn check:test:types 2>&1 | grep -iE "api-headless-cms-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the cms workflow and review graphql operations and fix the system.workflow type

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
