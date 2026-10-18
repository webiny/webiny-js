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
    "owner { id displayName } source ruleId strategy trace { ruleId outcome reason failedConditions } skipped { userId displayName reason } narrowedTeamId candidateIds candidateCount";

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
                trace: [
                    { ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }
                ],
                skipped: [],
                narrowedTeamId: null,
                candidateIds: [],
                candidateCount: 0
            },
            error: null
        });
        expect(inRoot.inspectCmsEntryRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
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
        const otherType = await run(editor, FOLDER_EXISTS, {
            id: "folder-parent",
            type: "wb:page"
        });
        const missing = await run(editor, FOLDER_EXISTS, { id: "folder-gone", type: "cms:author" });
        const refused = await run(reader, FOLDER_EXISTS, {
            id: "folder-parent",
            type: "cms:author"
        });

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
