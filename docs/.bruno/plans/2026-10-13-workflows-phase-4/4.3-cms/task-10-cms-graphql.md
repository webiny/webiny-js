### Task 10: CMS routing GraphQL

Spec 10, 11; D69, D97, D104, D118, D128, D133, D136; R46, R88, R100, R104, R107, R120, R121, R124, R125, R128, R129. The five Task 9 wrappers on the `cms` root of `/graphql`, in `CmsWorkflowsSchemaFactory` (license-gated with the rest of the package, R100):

- `CmsQuery.listCmsEntryStepCandidates(workflowId: ID!, stepId: ID!, modelId: ID!, revisionId: ID!): CmsEntryStepCandidateListResponse!` — R107: a malformed `revisionId` is `Workflows/Review/Validation` ("The revision id is not valid.") before the wrapper; the entry id comes from the revision id (`parseIdentifier`), the namespace from `toCmsNamespace(modelId)` (R88).
- `CmsQuery.listCmsEntryReviewStepCandidates(reviewId: ID!, stepId: ID!): CmsEntryStepCandidateListResponse!`
- `CmsQuery.inspectCmsEntryRouting(stepConfig: JSON!, modelId: ID!, requesterId: ID!, folderId: ID): CmsEntryRoutingInspectionResponse!` — `folderId` missing or `null` is the root; the wrapper derives the folder type `cms:<modelId>` (R121).
- `CmsQuery.cmsEntryFolderExists(id: ID!, type: String!): WorkflowsBooleanResponse!`
- `CmsMutation.reassignCmsEntryReviewStep(reviewId: ID!, stepId: ID!, userId: ID!): CmsEntryReviewResponse!`

Envelopes are CMS types (`{ data, error }`, R100) around 4.2 Task 7's shared `WorkflowsStepCandidate` and `WorkflowsRoutingInspection` (with `WorkflowsUser`, `WorkflowsRoutingTraceEntry` and `WorkflowsRoutingSkip`); the folder answer reuses `WorkflowsBooleanResponse`. Each resolver calls only its wrapper (D132) and maps a failed result with `ErrorResponse`. Tests go through `/graphql` with Task 8's directory (`registerTestUsers`, `permissionsByIdentity`, which `createGraphQLClient` now passes through) and pin the R107 refusal with `engineCalls`, the cross-app refusals (a WB review is not found and stays unchanged, R46; a WB workflow is not found before the engine, R128) and the license gate.

**Files:**
- Modify: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/graphql.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts`

**Interfaces:**
- Consumes:
  - Task 9: `ReassignCmsEntryReviewStepUseCase` (`Input { reviewId; stepId; userId }`), `ListCmsEntryStepCandidatesUseCase` (`Input { workflowId; stepId; model; targetId; targetRevisionId }`), `ListCmsEntryReviewStepCandidatesUseCase` (`Input { reviewId; stepId }`), `InspectCmsEntryRoutingUseCase` (`Input { stepConfig: unknown; model; requesterId; folderId?: string | null }`), `CmsEntryFolderExistsUseCase` (`Input { id; type }`, value `boolean`); refusal actions `"reassign this step"`, `"list the step's candidates"`, `"inspect routing"`, `"check folders"`.
  - 4.2 Task 7 (shared types in `/graphql`): `WorkflowsUser { id: ID! displayName: String! }`, `WorkflowsStepCandidate { id: ID! displayName: String! excluded: Boolean! excludedReason: String }`, `enum WorkflowsRoutingTraceOutcome { matched notMatched skipped }`, `WorkflowsRoutingTraceEntry { ruleId: String! outcome: WorkflowsRoutingTraceOutcome! reason: String }`, `WorkflowsRoutingSkip { userId: ID! displayName: String reason: String! }`, `WorkflowsRoutingInspection { owner: WorkflowsUser source: String! ruleId: String strategy: String trace: [WorkflowsRoutingTraceEntry!]! skipped: [WorkflowsRoutingSkip!]! }`; existing `WorkflowsBooleanResponse { data: Boolean error: WorkflowsError }`, scalar `JSON`.
  - Task 8 test helpers: `registerTestUsers`, `addTestFolder`, `testFolders`, `createUserContext({ permissionsByIdentity })`.
  - Phase 3: `isValidRevisionId`, `toCmsNamespace`, `parseIdentifier` (`@webiny/utils`), `ErrorResponse`, `Response` (`@webiny/api-graphql`), `ReviewValidationError`.
- Produces:
  - GraphQL types `CmsEntryStepCandidateListResponse { data: [WorkflowsStepCandidate!] error: WorkflowsError }`, `CmsEntryRoutingInspectionResponse { data: WorkflowsRoutingInspection error: WorkflowsError }`.
  - The five root fields above (names per R124).
  - Test helper: `GraphQLClientParams.permissionsByIdentity`.

- [ ] **Step 1: Write the failing tests**

In `packages/api-headless-cms-workflows/__tests__/__helpers/graphql.ts`, add to `GraphQLClientParams` after `permissions`:

```ts
    /** Permissions of other users, for routing and candidate read checks. */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
```

and pass it to `createContextHandler`, after `permissions: params.permissions,`:

```ts
        permissionsByIdentity: params.permissionsByIdentity,
```

In `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`, replace `CMS_QUERY_FIELDS` and `CMS_MUTATION_FIELDS` with:

```ts
const CMS_QUERY_FIELDS = [
    "listCmsEntryWorkflows",
    "getCmsEntryWorkflow",
    "getCmsEntryReview",
    "getCmsEntryTargetReview",
    "listCmsEntryReviews",
    "listCmsEntryWorkflowModels",
    "listCmsEntryStepCandidates",
    "listCmsEntryReviewStepCandidates",
    "inspectCmsEntryRouting",
    "cmsEntryFolderExists"
];

const CMS_MUTATION_FIELDS = [
    "storeCmsEntryWorkflow",
    "deleteCmsEntryWorkflow",
    "requestCmsEntryReview",
    "startCmsEntryReviewStep",
    "takeOverCmsEntryReviewStep",
    "reassignCmsEntryReviewStep",
    "approveCmsEntryReviewStep",
    "rejectCmsEntryReviewStep",
    "cancelCmsEntryReview",
    "cancelCmsEntryReviewsForDelete"
];
```

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { addTestFolder, testFolders } from "~tests/__helpers/FakeFolders.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER
} from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    CMS_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/permissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";

const ERROR = "error { code message data }";
const REVIEW = "id model state currentStepState currentOwnerId";
const CANDIDATE = "id displayName excluded excludedReason";
const INSPECTION =
    "owner { id displayName } source ruleId strategy trace { ruleId outcome reason } skipped { userId displayName reason }";

const LIST_STEP_CANDIDATES = /* GraphQL */ `
    query ListStepCandidates(
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
                data { ${CANDIDATE} }
                ${ERROR}
            }
        }
    }
`;

const LIST_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        cms {
            listCmsEntryReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
                data { ${CANDIDATE} }
                ${ERROR}
            }
        }
    }
`;

const INSPECT_ROUTING = /* GraphQL */ `
    query InspectRouting(
        $stepConfig: JSON!
        $modelId: ID!
        $requesterId: ID!
        $folderId: ID
    ) {
        cms {
            inspectCmsEntryRouting(
                stepConfig: $stepConfig
                modelId: $modelId
                requesterId: $requesterId
                folderId: $folderId
            ) {
                data { ${INSPECTION} }
                ${ERROR}
            }
        }
    }
`;

const FOLDER_EXISTS = /* GraphQL */ `
    query FolderExists($id: ID!, $type: String!) {
        cms {
            cmsEntryFolderExists(id: $id, type: $type) {
                data
                ${ERROR}
            }
        }
    }
`;

const REASSIGN_STEP = /* GraphQL */ `
    mutation ReassignStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        cms {
            reassignCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, userId: $userId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

/** CMS permissions of the users routing evaluates as candidates. */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER,
    [OTHER_REVIEWER.id]: CMS_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const ON_HOLIDAY = "On holiday.";

/** One rule: entries under "folder-parent" (descendants included) go to REVIEWER. */
const FOLDER_RULE_CONFIG = {
    teams: [REVIEW_TEAM],
    assignment: {
        strategy: "none",
        allowManualPick: false,
        rules: [
            {
                id: "rule-1",
                conditions: {
                    folder: { id: "folder-parent", type: "cms:author", includeDescendants: true }
                },
                target: { type: "user", id: REVIEWER.id }
            }
        ]
    }
};

/** A `/graphql` client as the identity, with the directory and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [...createExtraModelPlugins(), registerTestUsers, countEngineCalls]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

/**
 * Admin stores the workflow (pool of "team-1"), excludes OTHER_REVIEWER ("On holiday.") and
 * REQUESTER asks for a review of "Ann" (root). The step waits in the pool.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    return { admin, entry, review };
};

describe("CMS routing GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        testFolders.clear();
        folderLevels.clear();
    });

    it("reassigns a step and returns the refusal with code and data (R124, R125)", async () => {
        const { review } = await createScenario();
        const reassigner = clientFor(REASSIGNER, REASSIGNER_PERMISSIONS);
        const reviewer = clientFor(REVIEWER, CMS_READER);
        const step = { reviewId: review.id, stepId: STEP_ID };

        const refused = await run(reviewer, REASSIGN_STEP, { ...step, userId: OTHER_REVIEWER.id });
        const reassigned = await run(reassigner, REASSIGN_STEP, { ...step, userId: REVIEWER.id });
        const invalid = await run(reassigner, REASSIGN_STEP, { ...step, userId: READER.id });

        expect(refused.reassignCmsEntryReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to reassign this step.",
                data: { action: "reassign this step" }
            }
        });
        expect(reassigned.reassignCmsEntryReviewStep.error).toBeNull();
        expect(reassigned.reassignCmsEntryReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview",
            currentOwnerId: REVIEWER.id
        });
        expect(invalid.reassignCmsEntryReviewStep.data).toBeNull();
        expect(invalid.reassignCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/ReassignTargetInvalid",
            data: { userId: READER.id, reason: "Not a member of the step's teams." }
        });
    });

    it("reports a Website Builder review as not found for reassign and leaves it unchanged (R46)", async () => {
        const wbReview = await createWbReview();
        const reassigner = clientFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, REASSIGN_STEP, {
            reviewId: wbReview.id,
            stepId: STEP_ID,
            userId: REVIEWER.id
        });
        const candidates = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: wbReview.id,
            stepId: STEP_ID
        });

        for (const response of [
            result.reassignCmsEntryReviewStep,
            candidates.listCmsEntryReviewStepCandidates
        ]) {
            expect(response.data).toBeNull();
            expect(response.error).toMatchObject({
                code: "Workflows/Review/NotFound",
                data: { id: wbReview.id }
            });
        }
        expect(engineCalls).not.toContain("ReassignReviewStep");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists the request candidates by model id and revision id, redacted for a plain requester (R120)", async () => {
        const { entry } = await createScenario();
        const requester = clientFor(REQUESTER, CMS_WRITER);
        const requesterWithEditor = clientFor(REQUESTER, [WORKFLOWS_EDITOR, ...CMS_WRITER]);
        const variables = {
            workflowId: "workflow-1",
            stepId: STEP_ID,
            modelId: "author",
            revisionId: entry.id
        };

        const plain = await run(requester, LIST_STEP_CANDIDATES, variables);
        const withEditor = await run(requesterWithEditor, LIST_STEP_CANDIDATES, variables);

        expect(plain.listCmsEntryStepCandidates).toEqual({
            data: [
                {
                    id: OTHER_REVIEWER.id,
                    displayName: OTHER_REVIEWER.displayName,
                    excluded: true,
                    excludedReason: null
                },
                {
                    id: REVIEWER.id,
                    displayName: REVIEWER.displayName,
                    excluded: false,
                    excludedReason: null
                }
            ],
            error: null
        });
        expect(withEditor.listCmsEntryStepCandidates.data[0].excludedReason).toBe(ON_HOLIDAY);
    });

    it("returns the revision id validation error before the wrapper (R107)", async () => {
        await createScenario();
        const requester = clientFor(REQUESTER, CMS_WRITER);

        for (const revisionId of ["#0001", "abc", "abc#x"]) {
            const result = await run(requester, LIST_STEP_CANDIDATES, {
                workflowId: "workflow-1",
                stepId: STEP_ID,
                modelId: "author",
                revisionId
            });

            expect(result.listCmsEntryStepCandidates).toEqual({
                data: null,
                error: {
                    code: "Workflows/Review/Validation",
                    message: "The revision id is not valid.",
                    data: null
                }
            });
        }
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Website Builder workflow as not found (R46, R128)", async () => {
        const { entry } = await createScenario();
        await createWbReview();
        const requester = clientFor(REQUESTER, CMS_WRITER);

        const result = await run(requester, LIST_STEP_CANDIDATES, {
            workflowId: "wb-workflow",
            stepId: STEP_ID,
            modelId: "author",
            revisionId: entry.id
        });

        expect(result.listCmsEntryStepCandidates.data).toBeNull();
        expect(result.listCmsEntryStepCandidates.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "wb-workflow" }
        });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists a review step's candidates with reasons for a reassigner", async () => {
        const { review } = await createScenario();
        const reassigner = clientFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: review.id,
            stepId: STEP_ID
        });

        expect(result.listCmsEntryReviewStepCandidates).toEqual({
            data: [
                {
                    id: OTHER_REVIEWER.id,
                    displayName: OTHER_REVIEWER.displayName,
                    excluded: true,
                    excludedReason: ON_HOLIDAY
                },
                {
                    id: REVIEWER.id,
                    displayName: REVIEWER.displayName,
                    excluded: false,
                    excludedReason: null
                }
            ],
            error: null
        });
    });

    it("inspects an unsaved config for an editor and refuses everyone else (R121)", async () => {
        await createScenario();
        addTestFolder({ id: "folder-parent", type: "cms:author" });
        addTestFolder({ id: "folder-child", type: "cms:author", parentId: "folder-parent" });
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);
        const requester = clientFor(REQUESTER, CMS_WRITER);
        const variables = {
            stepConfig: FOLDER_RULE_CONFIG,
            modelId: "author",
            requesterId: REQUESTER.id
        };

        const inChild = await run(editor, INSPECT_ROUTING, {
            ...variables,
            folderId: "folder-child"
        });
        const inRoot = await run(editor, INSPECT_ROUTING, variables);
        const refused = await run(requester, INSPECT_ROUTING, variables);

        expect(inChild.inspectCmsEntryRouting).toEqual({
            data: {
                owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
                source: "rule",
                ruleId: "rule-1",
                strategy: "none",
                trace: [{ ruleId: "rule-1", outcome: "matched", reason: null }],
                skipped: []
            },
            error: null
        });
        expect(inRoot.inspectCmsEntryRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "notMatched", reason: null }],
            skipped: []
        });
        expect(refused.inspectCmsEntryRouting).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to inspect routing.",
                data: { action: "inspect routing" }
            }
        });
    });

    it("returns the step config validation error of the inspector", async () => {
        await createScenario();
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, INSPECT_ROUTING, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            modelId: "author",
            requesterId: REQUESTER.id
        });

        expect(result.inspectCmsEntryRouting.data).toBeNull();
        expect(result.inspectCmsEntryRouting.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("answers folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        addTestFolder({ id: "folder-parent", type: "cms:author" });
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);
        const reader = clientFor(READER, CMS_READER);

        const found = await run(editor, FOLDER_EXISTS, { id: "folder-parent", type: "cms:author" });
        const otherType = await run(editor, FOLDER_EXISTS, { id: "folder-parent", type: "wb:page" });
        const missing = await run(editor, FOLDER_EXISTS, { id: "folder-gone", type: "cms:author" });
        const refused = await run(reader, FOLDER_EXISTS, { id: "folder-parent", type: "cms:author" });

        expect(found.cmsEntryFolderExists).toEqual({ data: true, error: null });
        expect(otherType.cmsEntryFolderExists).toEqual({ data: false, error: null });
        expect(missing.cmsEntryFolderExists).toEqual({ data: false, error: null });
        expect(refused.cmsEntryFolderExists).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to check folders.",
                data: { action: "check folders" }
            }
        });
    });

    it("returns the anonymous refusal with its code and keeps the review unchanged", async () => {
        const { review } = await createScenario();
        const anonymous = clientFor(null, []);
        const admin = createGraphQLClient();

        const candidates = await run(anonymous, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const reassign = await run(anonymous, REASSIGN_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            userId: REVIEWER.id
        });
        const read = await run(admin, GET_REVIEW, { id: review.id });

        expect(candidates.listCmsEntryReviewStepCandidates.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
        expect(reassign.reassignCmsEntryReviewStep.error.code).toBe("Workflows/NotAuthenticated");
        expect(read.getCmsEntryReview.data.review).toMatchObject({
            currentStepState: "awaiting",
            currentOwnerId: null
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts 2>&1 | tail -50`
Expected: FAIL: every routing operation returns a GraphQL error `Cannot query field "listCmsEntryStepCandidates" on type "CmsQuery"` (and the others), so `body.errors` is defined; the license test misses the five new field names.

- [ ] **Step 3: Schema and resolvers**

In `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`, add the imports after the `CancelCmsEntryReviewsForDeleteUseCase` import:

```ts
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";
```

add the argument types after `CancelCmsEntryReviewsForDeleteArgs`:

```ts
interface ListCmsEntryStepCandidatesArgs {
    workflowId: string;
    stepId: string;
    modelId: string;
    revisionId: string;
}

interface InspectCmsEntryRoutingArgs {
    /** The unsaved step config (`JSON`); the engine validates it. */
    stepConfig: unknown;
    modelId: string;
    requesterId: string;
    /** Missing or `null`: the root folder. */
    folderId?: string | null;
}
```

In `CMS_WORKFLOWS_TYPE_DEFS`, add after the `CmsEntryWorkflowModelListResponse` type:

```graphql
    type CmsEntryStepCandidateListResponse {
        data: [WorkflowsStepCandidate!]
        error: WorkflowsError
    }

    type CmsEntryRoutingInspectionResponse {
        data: WorkflowsRoutingInspection
        error: WorkflowsError
    }
```

add to `extend type CmsQuery`, after the `listCmsEntryWorkflowModels(...)` field:

```graphql
        listCmsEntryStepCandidates(
            workflowId: ID!
            stepId: ID!
            modelId: ID!
            revisionId: ID!
        ): CmsEntryStepCandidateListResponse!
        listCmsEntryReviewStepCandidates(
            reviewId: ID!
            stepId: ID!
        ): CmsEntryStepCandidateListResponse!
        inspectCmsEntryRouting(
            stepConfig: JSON!
            modelId: ID!
            requesterId: ID!
            folderId: ID
        ): CmsEntryRoutingInspectionResponse!
        cmsEntryFolderExists(id: ID!, type: String!): WorkflowsBooleanResponse!
```

and to `extend type CmsMutation`, after `takeOverCmsEntryReviewStep(...)`:

```graphql
        reassignCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            userId: ID!
        ): CmsEntryReviewResponse!
```

In `execute`, add after the `CmsMutation.takeOverCmsEntryReviewStep` resolver:

```ts
        builder.addResolver<ReassignCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.reassignCmsEntryReviewStep",
            dependencies: [ReassignCmsEntryReviewStepUseCase],
            resolver: (reassignStep: ReassignCmsEntryReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await reassignStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        userId: args.userId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

and before `return builder;`:

```ts
        // Routing (R120, R121, R124, R125)
        builder.addResolver<ListCmsEntryStepCandidatesArgs>({
            path: "CmsQuery.listCmsEntryStepCandidates",
            dependencies: [ListCmsEntryStepCandidatesUseCase],
            resolver: (listCandidates: ListCmsEntryStepCandidatesUseCase.Interface) => {
                return async ({ args }) => {
                    // A malformed revision id is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await listCandidates.execute({
                        workflowId: args.workflowId,
                        stepId: args.stepId,
                        model: toCmsNamespace(args.modelId),
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryReviewStepCandidatesUseCase.Input>({
            path: "CmsQuery.listCmsEntryReviewStepCandidates",
            dependencies: [ListCmsEntryReviewStepCandidatesUseCase],
            resolver: (listCandidates: ListCmsEntryReviewStepCandidatesUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listCandidates.execute({
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

        builder.addResolver<InspectCmsEntryRoutingArgs>({
            path: "CmsQuery.inspectCmsEntryRouting",
            dependencies: [InspectCmsEntryRoutingUseCase],
            resolver: (inspectRouting: InspectCmsEntryRoutingUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await inspectRouting.execute({
                        stepConfig: args.stepConfig,
                        model: toCmsNamespace(args.modelId),
                        requesterId: args.requesterId,
                        folderId: args.folderId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CmsEntryFolderExistsUseCase.Input>({
            path: "CmsQuery.cmsEntryFolderExists",
            dependencies: [CmsEntryFolderExistsUseCase],
            resolver: (folderExists: CmsEntryFolderExistsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await folderExists.execute({ id: args.id, type: args.type });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run, one at a time:
`yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the cms routing graphql operations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
