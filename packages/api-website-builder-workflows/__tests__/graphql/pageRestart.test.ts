import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { registerFakeTaskService, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { REQUESTER, REVIEWER, WB_READER, WB_WRITER } from "~tests/__helpers/identities.js";
import { asGraphQLUser, GET_REVIEW, RESTART_STEP } from "~tests/__helpers/graphql.js";

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER
};

/** A `/graphql` user with the test automation, the fake task seams and the engine call counter. */
const graphQLUserFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return asGraphQLUser({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            registerTestAutomation,
            registerFakeTaskService,
            registerFakeGetTask,
            countEngineCalls
        ]
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

/** Admin stores the pages workflow and REQUESTER asks for a review of "Page A", its step failed. */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    return { admin, review };
};

describe("WB restart GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("restarts a failed step and returns the new run data (R158)", async () => {
        const { review } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const before = await run(requester, GET_REVIEW, { id: review.id });
        const restarted = await run(requester, RESTART_STEP, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const after = await run(requester, GET_REVIEW, { id: review.id });

        expect(before.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(true);
        expect(restarted.restartWebsiteBuilderPageReviewStep.error).toBeNull();
        expect(restarted.restartWebsiteBuilderPageReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview"
        });
        expect(restarted.restartWebsiteBuilderPageReviewStep.data.steps[0]).toMatchObject({
            taskId: "task-1",
            runs: [{ taskId: "task-old", outcome: "failed", reason: FAILED_REASON }]
        });
        expect(after.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(false);
    });

    it("returns the refusal with code and data for a viewer without reassign (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = graphQLUserFor(REVIEWER, WB_READER);

        const refused = await run(reviewer, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
        const flags = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(refused.restartWebsiteBuilderPageReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to restart a review step.",
                data: { action: "restart a review step" }
            }
        });
        expect(flags.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(false);
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("returns the engine's invalid-state error for a step that is not failed", async () => {
        const { review } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        const again = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(again.restartWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(again.restartWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/InvalidState",
            data: { transition: "restart" }
        });
    });

    it("reports a Headless CMS review as not found and leaves it unchanged (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const result = await run(requester, RESTART_STEP, {
            reviewId: cmsReview.id,
            stepId: STEP_ID
        });

        expect(result.restartWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(result.restartWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: cmsReview.id }
        });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = graphQLUserFor(null, []);

        const result = await run(anonymous, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(result.restartWebsiteBuilderPageReviewStep.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
    });
});
