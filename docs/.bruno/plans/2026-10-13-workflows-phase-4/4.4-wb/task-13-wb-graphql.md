### Task 13: WB routing GraphQL

Spec 10, 11; D69, D97, D104, D118, D128, D133, D136; R46, R88, R100, R104, R107, R120, R121, R124, R125, R128, R129. The five Task 12 wrappers on the `websiteBuilder` root of `/graphql`, in `WebsiteBuilderWorkflowsSchemaFactory` (license-gated with the rest of the package, R100), mirroring CMS Task 10:

- `WbQuery.listWebsiteBuilderPageStepCandidates(workflowId: ID!, stepId: ID!, revisionId: ID!): WbPageStepCandidateListResponse!` — R107: a malformed `revisionId` is `Workflows/Review/Validation` ("The revision id is not valid.") before the wrapper; the page id comes from the revision id (`parseIdentifier`, R88).
- `WbQuery.listWebsiteBuilderPageReviewStepCandidates(reviewId: ID!, stepId: ID!): WbPageStepCandidateListResponse!`
- `WbQuery.inspectWebsiteBuilderPageRouting(stepConfig: JSON!, requesterId: ID!, folderId: ID): WbPageRoutingInspectionResponse!` — `folderId` missing or `null` is the root; the wrapper derives the folder type `wb:page` (R121).
- `WbQuery.websiteBuilderPageFolderExists(id: ID!): WorkflowsBooleanResponse!` — no `type` argument: a page folder is always `wb:page` (R124).
- `WbMutation.reassignWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!, userId: ID!): WbPageReviewResponse!`

Envelopes are WB types (`{ data, error }`, R100) around 4.2 Task 7's shared `WorkflowsStepCandidate` and `WorkflowsRoutingInspection` (with `WorkflowsUser`, `WorkflowsRoutingTraceEntry` and `WorkflowsRoutingSkip`); the folder answer reuses `WorkflowsBooleanResponse`. Each resolver calls only its wrapper (D132) and maps a failed result with `ErrorResponse`, which keeps `code`, `message` and `data`; resolvers never catch. Tests go through `/graphql` with Task 11's directory (`registerTestUsers`, `permissionsByIdentity`, which `asGraphQLUser` already passes through) and pin the R107 refusal with `engineCalls`, the cross-app refusals (a Headless CMS review is not found and stays unchanged; a Headless CMS workflow is not found, before the engine, R46, R128), and the license gate.

**Files:**
- Modify: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts`

**Interfaces:**
- Consumes:
  - Task 12: `ReassignWebsiteBuilderPageReviewStepUseCase` (`Input { reviewId; stepId; userId }`), `ListWebsiteBuilderPageStepCandidatesUseCase` (`Input { workflowId; stepId; targetId; targetRevisionId }`), `ListWebsiteBuilderPageReviewStepCandidatesUseCase` (`Input { reviewId; stepId }`), `InspectWebsiteBuilderPageRoutingUseCase` (`Input { stepConfig: unknown; requesterId; folderId?: string | null }`), `WebsiteBuilderPageFolderExistsUseCase` (`Input { id }`, value `boolean`); refusal actions `"reassign this step"`, `"list the step's candidates"`, `"inspect routing"`, `"check folders"`.
  - 4.2 Task 7 (shared types in `/graphql`): `WorkflowsUser { id: ID! displayName: String! }`, `WorkflowsStepCandidate { id: ID! displayName: String! excluded: Boolean! excludedReason: String }`, `enum WorkflowsRoutingTraceOutcome { matched notMatched skipped }`, `WorkflowsRoutingTraceEntry { ruleId: String! outcome: WorkflowsRoutingTraceOutcome! reason: String }`, `WorkflowsRoutingSkip { userId: ID! displayName: String reason: String! }`, `WorkflowsRoutingInspection { owner: WorkflowsUser source: String! ruleId: String strategy: String trace: [WorkflowsRoutingTraceEntry!]! skipped: [WorkflowsRoutingSkip!]! }`; existing `WorkflowsBooleanResponse { data: Boolean error: WorkflowsError }`, scalar `JSON`.
  - Task 11 test helpers: `registerTestUsers` (`~tests/__helpers/FakeListUsers.js`), `registerAco`, `createWbFolder` (`~tests/__helpers/aco.js`).
  - Phase 3: `isValidRevisionId` (`./isValidRevisionId.js`), `parseIdentifier` (`@webiny/utils`), `ErrorResponse`, `Response` (`@webiny/api-graphql`), `ReviewValidationError`, `asGraphQLUser`, `TYPE_FIELDS`, `createCmsReview`, `WorkflowsNotAuthorizedError` message `You are not allowed to <action>.`.
- Produces:
  - GraphQL types `WbPageStepCandidateListResponse { data: [WorkflowsStepCandidate!] error: WorkflowsError }`, `WbPageRoutingInspectionResponse { data: WorkflowsRoutingInspection error: WorkflowsError }`.
  - The five root fields above (names per R124).
  - Test helper constants (`~tests/__helpers/graphql.js`): `LIST_STEP_CANDIDATES`, `LIST_REVIEW_STEP_CANDIDATES`, `INSPECT_ROUTING`, `FOLDER_EXISTS`, `REASSIGN_STEP`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`:

```ts
const CANDIDATE_FIELDS = /* GraphQL */ `
    id
    displayName
    excluded
    excludedReason
`;

const INSPECTION_FIELDS = /* GraphQL */ `
    owner {
        id
        displayName
    }
    source
    ruleId
    strategy
    trace {
        ruleId
        outcome
        reason
    }
    skipped {
        userId
        displayName
        reason
    }
`;

export const LIST_STEP_CANDIDATES = /* GraphQL */ `
    query ListStepCandidates($workflowId: ID!, $stepId: ID!, $revisionId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageStepCandidates(
                workflowId: $workflowId
                stepId: $stepId
                revisionId: $revisionId
            ) {
                data { ${CANDIDATE_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
                data { ${CANDIDATE_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const INSPECT_ROUTING = /* GraphQL */ `
    query InspectRouting($stepConfig: JSON!, $requesterId: ID!, $folderId: ID) {
        websiteBuilder {
            inspectWebsiteBuilderPageRouting(
                stepConfig: $stepConfig
                requesterId: $requesterId
                folderId: $folderId
            ) {
                data { ${INSPECTION_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const FOLDER_EXISTS = /* GraphQL */ `
    query FolderExists($id: ID!) {
        websiteBuilder {
            websiteBuilderPageFolderExists(id: $id) {
                data
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const REASSIGN_STEP = /* GraphQL */ `
    mutation ReassignStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        websiteBuilder {
            reassignWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                userId: $userId
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

In `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts` replace `QUERIES` and `MUTATIONS` with:

```ts
const QUERIES = [
    "listWebsiteBuilderPageWorkflows",
    "getWebsiteBuilderPageWorkflow",
    "getWebsiteBuilderPageReview",
    "getWebsiteBuilderPageTargetReview",
    "listWebsiteBuilderPageReviews",
    "listWebsiteBuilderPageStepCandidates",
    "listWebsiteBuilderPageReviewStepCandidates",
    "inspectWebsiteBuilderPageRouting",
    "websiteBuilderPageFolderExists"
];

const MUTATIONS = [
    "storeWebsiteBuilderPageWorkflow",
    "deleteWebsiteBuilderPageWorkflow",
    "requestWebsiteBuilderPageReview",
    "startWebsiteBuilderPageReviewStep",
    "takeOverWebsiteBuilderPageReviewStep",
    "reassignWebsiteBuilderPageReviewStep",
    "approveWebsiteBuilderPageReviewStep",
    "rejectWebsiteBuilderPageReviewStep",
    "cancelWebsiteBuilderPageReview",
    "cancelWebsiteBuilderPageReviewsForDelete"
];
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, registerAco } from "~tests/__helpers/aco.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import {
    asGraphQLUser,
    FOLDER_EXISTS,
    GET_REVIEW,
    INSPECT_ROUTING,
    LIST_REVIEW_STEP_CANDIDATES,
    LIST_STEP_CANDIDATES,
    REASSIGN_STEP
} from "~tests/__helpers/graphql.js";

/** Page permissions of the users routing evaluates as candidates. */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER,
    [OTHER_REVIEWER.id]: WB_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const ON_HOLIDAY = "On holiday.";

const REVISION_ID_ERROR = {
    code: "Workflows/Review/Validation",
    message: "The revision id is not valid.",
    data: null
};

/** An unsaved step config with one rule: pages under the folder (descendants) go to REVIEWER. */
const folderRuleConfig = (folderId: string) => {
    return {
        teams: [REVIEW_TEAM],
        assignment: {
            strategy: "none",
            allowManualPick: false,
            rules: [
                {
                    id: "rule-campaigns",
                    conditions: {
                        folder: { id: folderId, type: "wb:page", includeDescendants: true }
                    },
                    target: { type: "user", id: REVIEWER.id }
                }
            ]
        }
    };
};

/** A `/graphql` user with the directory, real ACO folders and the engine call counter. */
const graphQLUserFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return asGraphQLUser({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [registerAco, registerTestUsers, countEngineCalls]
    });
};

/** Runs an operation and returns `data.websiteBuilder`; a GraphQL-level error fails the test. */
const run = async (
    user: ReturnType<typeof asGraphQLUser>,
    query: string,
    variables?: Record<string, unknown>
) => {
    const body = await user.run(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.websiteBuilder;
};

/**
 * Admin stores the pages workflow (pool of "team-1"), excludes OTHER_REVIEWER ("On holiday.")
 * and REQUESTER asks for a review of "Page A" (root). The step waits in the pool. "Quiet page"
 * has no review.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const page = await createPage(admin, { title: "Page A" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    return { admin, page, quietPage, review };
};

/** Real ACO folders: Campaigns > Spring (pages). */
const createFolders = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerAco] });
    const campaigns = await createWbFolder(admin, { title: "Campaigns", slug: "campaigns" });
    const spring = await createWbFolder(admin, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    return { campaigns, spring };
};

describe("WB routing GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("reassigns a step and returns the refusal and the engine's error with code and data (R124, R125)", async () => {
        const { review } = await createScenario();
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);
        const reviewer = graphQLUserFor(REVIEWER, WB_READER);
        const step = { reviewId: review.id, stepId: STEP_ID };

        const refused = await run(reviewer, REASSIGN_STEP, { ...step, userId: OTHER_REVIEWER.id });
        const reassigned = await run(reassigner, REASSIGN_STEP, { ...step, userId: REVIEWER.id });
        const invalid = await run(reassigner, REASSIGN_STEP, { ...step, userId: READER.id });

        expect(refused.reassignWebsiteBuilderPageReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to reassign this step.",
                data: { action: "reassign this step" }
            }
        });
        expect(reassigned.reassignWebsiteBuilderPageReviewStep.error).toBeNull();
        expect(reassigned.reassignWebsiteBuilderPageReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview",
            steps: [{ id: STEP_ID, state: "inReview", owner: { id: REVIEWER.id } }]
        });
        expect(invalid.reassignWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(invalid.reassignWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/ReassignTargetInvalid",
            data: { userId: READER.id, reason: "Not a member of the step's teams." }
        });
    });

    it("reports a Headless CMS review as not found and leaves it unchanged (R46)", async () => {
        const admin = await createUserContext({ legacyPlugins: [registerTestUsers] });
        const cmsReview = await createCmsReview(admin);
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, REASSIGN_STEP, {
            reviewId: cmsReview.id,
            stepId: STEP_ID,
            userId: REVIEWER.id
        });
        const candidates = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: cmsReview.id,
            stepId: STEP_ID
        });

        for (const response of [
            result.reassignWebsiteBuilderPageReviewStep,
            candidates.listWebsiteBuilderPageReviewStepCandidates
        ]) {
            expect(response.data).toBeNull();
            expect(response.error).toMatchObject({
                code: "Workflows/Review/NotFound",
                data: { id: cmsReview.id }
            });
        }
        expect(engineCalls).not.toContain("ReassignReviewStep");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists the request candidates by revision id, redacted for a plain requester (R120)", async () => {
        const { quietPage } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        const requesterWithEditor = graphQLUserFor(REQUESTER, [WORKFLOWS_EDITOR, ...WB_WRITER]);
        const variables = { workflowId: "wb-workflow", stepId: STEP_ID, revisionId: quietPage.id };

        const plain = await run(requester, LIST_STEP_CANDIDATES, variables);
        const withEditor = await run(requesterWithEditor, LIST_STEP_CANDIDATES, variables);

        expect(plain.listWebsiteBuilderPageStepCandidates).toEqual({
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
        expect(withEditor.listWebsiteBuilderPageStepCandidates.data[0].excludedReason).toBe(
            ON_HOLIDAY
        );
    });

    it("reports a Headless CMS workflow as not found (R46, R128)", async () => {
        const { admin, quietPage } = await createScenario();
        await createCmsReview(admin);
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const result = await run(requester, LIST_STEP_CANDIDATES, {
            workflowId: "cms-workflow",
            stepId: STEP_ID,
            revisionId: quietPage.id
        });

        expect(result.listWebsiteBuilderPageStepCandidates.data).toBeNull();
        expect(result.listWebsiteBuilderPageStepCandidates.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "cms-workflow" }
        });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("returns the revision id validation error before the wrapper (R107)", async () => {
        await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        for (const revisionId of ["", "#0001", "abc", "abc#x", "abc#0"]) {
            const result = await run(requester, LIST_STEP_CANDIDATES, {
                workflowId: "wb-workflow",
                stepId: STEP_ID,
                revisionId
            });

            expect(result.listWebsiteBuilderPageStepCandidates).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
        expect(engineCalls).toEqual([]);
    });

    it("lists a review step's candidates with reasons for a reassigner", async () => {
        const { review } = await createScenario();
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: review.id,
            stepId: STEP_ID
        });

        expect(result.listWebsiteBuilderPageReviewStepCandidates).toEqual({
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
        const { campaigns, spring } = await createFolders();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        const variables = { stepConfig: folderRuleConfig(campaigns.id), requesterId: REQUESTER.id };

        const inSpring = await run(editor, INSPECT_ROUTING, { ...variables, folderId: spring.id });
        const inRoot = await run(editor, INSPECT_ROUTING, variables);
        const refused = await run(requester, INSPECT_ROUTING, variables);

        expect(inSpring.inspectWebsiteBuilderPageRouting).toEqual({
            data: {
                owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
                source: "rule",
                ruleId: "rule-campaigns",
                strategy: "none",
                trace: [{ ruleId: "rule-campaigns", outcome: "matched", reason: null }],
                skipped: []
            },
            error: null
        });
        expect(inRoot.inspectWebsiteBuilderPageRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-campaigns", outcome: "notMatched", reason: null }],
            skipped: []
        });
        expect(refused.inspectWebsiteBuilderPageRouting).toEqual({
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
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, INSPECT_ROUTING, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            requesterId: REQUESTER.id
        });

        expect(result.inspectWebsiteBuilderPageRouting.data).toBeNull();
        expect(result.inspectWebsiteBuilderPageRouting.error.code).toBe(
            "Workflows/Workflow/Validation"
        );
    });

    it("answers page folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const { spring } = await createFolders();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);
        const reader = graphQLUserFor(READER, WB_READER);

        const found = await run(editor, FOLDER_EXISTS, { id: spring.id });
        const missing = await run(editor, FOLDER_EXISTS, { id: "folder-gone" });
        const refused = await run(reader, FOLDER_EXISTS, { id: spring.id });

        expect(found.websiteBuilderPageFolderExists).toEqual({ data: true, error: null });
        expect(missing.websiteBuilderPageFolderExists).toEqual({ data: false, error: null });
        expect(refused.websiteBuilderPageFolderExists).toEqual({
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
        const anonymous = graphQLUserFor(null, []);
        const admin = asGraphQLUser();

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

        expect(candidates.listWebsiteBuilderPageReviewStepCandidates.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
        expect(reassign.reassignWebsiteBuilderPageReviewStep.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
        expect(read.getWebsiteBuilderPageReview.data.review).toMatchObject({
            currentStepState: "awaiting",
            steps: [{ id: STEP_ID, state: "awaiting", owner: null }]
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts packages/api-website-builder-workflows/__tests__/graphql/license.test.ts 2>&1 | tail -50`
Expected: FAIL: every routing operation returns a GraphQL error `Cannot query field "listWebsiteBuilderPageStepCandidates" on type "WbQuery"` (and the others), so `body.errors` is defined; the license test misses the five new field names. Record it as RED.

- [ ] **Step 3: Schema and resolvers**

In `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`, add the imports after the `CancelWebsiteBuilderPageReviewsForDeleteUseCase` import:

```ts
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";
```

add the argument type after `CancelWebsiteBuilderPageReviewsForDeleteArgs`:

```ts
interface ListWebsiteBuilderPageStepCandidatesArgs {
    workflowId: string;
    stepId: string;
    /** `<pageId>#<version>`; the page id is parsed from it (R88). */
    revisionId: string;
}
```

In `WB_WORKFLOWS_TYPE_DEFS`, add after the `WbPageReviewListResponse` type:

```graphql
    type WbPageStepCandidateListResponse {
        data: [WorkflowsStepCandidate!]
        error: WorkflowsError
    }

    type WbPageRoutingInspectionResponse {
        data: WorkflowsRoutingInspection
        error: WorkflowsError
    }
```

add to `extend type WbQuery`, after the `listWebsiteBuilderPageReviews(...)` field:

```graphql
        "Who could take a step of a review of this page revision (request dialog, R120)."
        listWebsiteBuilderPageStepCandidates(
            workflowId: ID!
            stepId: ID!
            revisionId: ID!
        ): WbPageStepCandidateListResponse!
        "Who a review step can be reassigned to (R120)."
        listWebsiteBuilderPageReviewStepCandidates(
            reviewId: ID!
            stepId: ID!
        ): WbPageStepCandidateListResponse!
        "folderId: a page folder; omitted or null is the root (R121)."
        inspectWebsiteBuilderPageRouting(
            stepConfig: JSON!
            requesterId: ID!
            folderId: ID
        ): WbPageRoutingInspectionResponse!
        "Whether a page folder still exists; the answer only (D69)."
        websiteBuilderPageFolderExists(id: ID!): WorkflowsBooleanResponse!
```

and to `extend type WbMutation`, after `takeOverWebsiteBuilderPageReviewStep(...)`:

```graphql
        reassignWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            userId: ID!
        ): WbPageReviewResponse!
```

In `execute`, add after the `WbMutation.takeOverWebsiteBuilderPageReviewStep` resolver:

```ts
        builder.addResolver<ReassignWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.reassignWebsiteBuilderPageReviewStep",
            dependencies: [ReassignWebsiteBuilderPageReviewStepUseCase],
            resolver: (reassignStep: ReassignWebsiteBuilderPageReviewStepUseCase.Interface) => {
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
        builder.addResolver<ListWebsiteBuilderPageStepCandidatesArgs>({
            path: "WbQuery.listWebsiteBuilderPageStepCandidates",
            dependencies: [ListWebsiteBuilderPageStepCandidatesUseCase],
            resolver: (listCandidates: ListWebsiteBuilderPageStepCandidatesUseCase.Interface) => {
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

        builder.addResolver<ListWebsiteBuilderPageReviewStepCandidatesUseCase.Input>({
            path: "WbQuery.listWebsiteBuilderPageReviewStepCandidates",
            dependencies: [ListWebsiteBuilderPageReviewStepCandidatesUseCase],
            resolver: (
                listCandidates: ListWebsiteBuilderPageReviewStepCandidatesUseCase.Interface
            ) => {
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

        builder.addResolver<InspectWebsiteBuilderPageRoutingUseCase.Input>({
            path: "WbQuery.inspectWebsiteBuilderPageRouting",
            dependencies: [InspectWebsiteBuilderPageRoutingUseCase],
            resolver: (inspectRouting: InspectWebsiteBuilderPageRoutingUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await inspectRouting.execute({
                        stepConfig: args.stepConfig,
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

        builder.addResolver<WebsiteBuilderPageFolderExistsUseCase.Input>({
            path: "WbQuery.websiteBuilderPageFolderExists",
            dependencies: [WebsiteBuilderPageFolderExistsUseCase],
            resolver: (folderExists: WebsiteBuilderPageFolderExistsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await folderExists.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts packages/api-website-builder-workflows/__tests__/graphql/license.test.ts packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
Expected: PASS.

Run, one at a time:
`yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-website-builder-workflows/__tests__/graphql/license.test.ts packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-website-builder-workflows): add the page routing graphql operations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
