import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    FAILED_REASON,
    seedFailedAutomationStep,
    seedRejectedStep
} from "~tests/__helpers/seeds.js";
import {
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { failTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    abortedTasks,
    registerFakeTaskService,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js";

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER
};

/**
 * Admin stores the pages workflow and REQUESTER asks for reviews of "Page A" (root) and "Locked"
 * ("folder-locked"); the only step of each is then a failed automation run.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    const lockedReview = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, lockedPage)
    );
    return { admin, review, lockedReview };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            registerTestAutomation,
            registerFakeTaskService,
            registerFakeGetTask,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

const restart = (context: CmsContext, reviewId: string, stepId: string = STEP_ID) => {
    return context.container
        .resolve(RestartWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId });
};

describe("WB restart wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("restarts a failed step for the requester and re-reaches it as the requester (R153)", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const restarted = expectOk(await restart(requester, review.id));

        expect(restarted.currentStepState).toBe("inReview");
        expect(restarted.steps[0].taskId).toBe("task-1");
        expect(restarted.steps[0].runs).toEqual([
            expect.objectContaining({
                taskId: "task-old",
                outcome: "failed",
                reason: FAILED_REASON
            })
        ]);
        expect(triggeredTasks.map(task => task.identityId)).toEqual([REQUESTER.id]);
        expect(engineCalls).toContain("RestartReviewStep");
    });

    it("lets a viewer with reassign restart, and the task still runs as the requester (D82)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const restarted = expectOk(await restart(reassigner, review.id));

        expect(restarted.currentStepState).toBe("inReview");
        expect(triggeredTasks.map(task => task.identityId)).toEqual([REQUESTER.id]);
    });

    it("refuses a viewer who is neither the requester nor a reassigner, before the engine (R153)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await restart(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a requester without read access to the page, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "no-access"]]));
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await restart(requester, lockedReview.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("passes the engine's state errors through unchanged and triggers nothing", async () => {
        const { admin, review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const rejected = await seedRejectedStep(admin, review);

        const wrongStep = await restart(requester, review.id, "step-missing");
        const wrongState = await restart(requester, rejected.id);

        expect(wrongStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(wrongState.error.code).toBe("Workflows/Review/InvalidState");
        expect(wrongState.error.data).toMatchObject({ transition: "restart" });
        expect(engineCalls.filter(call => call === "RestartReviewStep")).toHaveLength(2);
        expect(triggeredTasks).toEqual([]);
    });

    it("passes a target sync error through unchanged, keeping the restarted review and the new task (R16)", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER, [failTargetSync]);

        const result = await restart(requester, review.id);

        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([]);
        const stored = expectOk(await requester.container.resolve(ReviewRepository).get(review.id));
        expect(stored.currentStepState).toBe("inReview");
        expect(stored.steps[0].taskId).toBe("task-1");
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER, [throwOnWorkflowsPermissions]);

        const result = await restart(requester, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await restart(requester, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const requester = await asUser(REQUESTER, WB_WRITER);

        const refused = await restart(anonymous, review.id);
        throwingAccessChecks.add("canRead");
        engineCalls.length = 0;
        const failed = await restart(requester, review.id);

        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});
