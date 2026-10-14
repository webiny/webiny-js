import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { REASSIGNER, REQUESTER, REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    throwingTargetRevisions,
    scriptTargetReads
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { failTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { abortedTasks, resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { RestartCmsEntryReviewStepUseCase } from "~/features/wrappers/RestartCmsEntryReviewStep/index.js";

const REQUESTER_PERMISSIONS = CMS_WRITER;
const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER
};

/**
 * Admin stores the workflow and REQUESTER asks for reviews of "Ann" (root) and "Locked"
 * ("folder-locked"); the only step of each is then a failed automation run.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    const lockedReview = await seedFailedAutomationStep(
        admin,
        await requestEntryReview(admin, lockedEntry)
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
            ...createExtraModelPlugins(),
            registerTestUsers,
            registerTestAutomation,
            registerFakeGetTask,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

/** Stores a copy of the review with its step rejected, the state the engine refuses to restart (R140). */
const asRejected = async (context: CmsContext, review: ReviewData): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(ReviewRepository).save({
            ...review,
            currentStepState: "rejected",
            steps: review.steps.map(step => ({ ...step, state: "rejected" as const }))
        })
    );
};

const restart = (context: CmsContext, reviewId: string, stepId: string = STEP_ID) => {
    return context.container
        .resolve(RestartCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId });
};

describe("CMS restart wrapper", () => {
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
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

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
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await restart(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a requester without read access to the target, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "no-access"]]));
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const result = await restart(requester, lockedReview.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("passes the engine's state errors through unchanged and triggers nothing", async () => {
        const { admin, review } = await createScenario();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);
        const rejected = await asRejected(admin, review);

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
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS, [failTargetSync]);

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
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS, [
            throwOnWorkflowsPermissions
        ]);

        const result = await restart(requester, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const result = await restart(requester, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const refused = await restart(anonymous, review.id);
        throwingAccessChecks.add("canRead");
        engineCalls.length = 0;
        const failed = await restart(requester, review.id);

        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});
