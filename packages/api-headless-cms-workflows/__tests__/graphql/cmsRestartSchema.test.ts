import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { REQUESTER, REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER
};

const STEP_FIELDS = "id state comment taskId runs { taskId outcome reason }";

const RESTART_STEP = /* GraphQL */ `
    mutation RestartStep($reviewId: ID!, $stepId: ID!) {
        cms {
            restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { id currentStepState steps { ${STEP_FIELDS} } }
                error { code message data }
            }
        }
    }
`;

const GET_REVIEW_FLAGS = /* GraphQL */ `
    query GetReviewFlags($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    review {
                        id
                        currentStepState
                    }
                    flags {
                        canRestart
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** A `/graphql` client as the identity, with the directory, the test automation and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            ...createExtraModelPlugins(),
            registerTestUsers,
            registerTestAutomation,
            registerFakeGetTask,
            countEngineCalls
        ]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

/** Admin stores the workflow and REQUESTER asks for a review of "Ann"; its only step then failed. */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    return { admin, review };
};

describe("CMS restart GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("restarts a failed step and returns the new run data (R158)", async () => {
        const { review } = await createScenario();
        const requester = clientFor(REQUESTER, CMS_WRITER);

        const before = await run(requester, GET_REVIEW_FLAGS, { id: review.id });
        const restarted = await run(requester, RESTART_STEP, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const after = await run(requester, GET_REVIEW_FLAGS, { id: review.id });

        expect(before.getCmsEntryReview.data.flags.canRestart).toBe(true);
        expect(restarted.restartCmsEntryReviewStep.error).toBeNull();
        expect(restarted.restartCmsEntryReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview"
        });
        expect(restarted.restartCmsEntryReviewStep.data.steps[0]).toMatchObject({
            taskId: "task-1",
            runs: [{ taskId: "task-old", outcome: "failed", reason: FAILED_REASON }]
        });
        expect(after.getCmsEntryReview.data.flags.canRestart).toBe(false);
    });

    it("returns the refusal with code and data for a viewer without reassign (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = clientFor(REVIEWER, CMS_READER);

        const refused = await run(reviewer, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
        const flags = await run(reviewer, GET_REVIEW_FLAGS, { id: review.id });

        expect(refused.restartCmsEntryReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to restart a review step.",
                data: { action: "restart a review step" }
            }
        });
        expect(flags.getCmsEntryReview.data.flags.canRestart).toBe(false);
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("returns the engine's invalid-state error for a step that is not failed", async () => {
        const { review } = await createScenario();
        const requester = clientFor(REQUESTER, CMS_WRITER);
        await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        const again = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(again.restartCmsEntryReviewStep.data).toBeNull();
        expect(again.restartCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/InvalidState",
            data: { transition: "restart" }
        });
    });

    it("reports a Website Builder review as not found and leaves it unchanged (R46)", async () => {
        const wbReview = await createWbReview();
        const requester = clientFor(REQUESTER, CMS_WRITER);

        const result = await run(requester, RESTART_STEP, {
            reviewId: wbReview.id,
            stepId: STEP_ID
        });

        expect(result.restartCmsEntryReviewStep.data).toBeNull();
        expect(result.restartCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = clientFor(null, []);

        const result = await run(anonymous, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(result.restartCmsEntryReviewStep.error.code).toBe("Workflows/NotAuthenticated");
    });
});
