import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData, ReviewStepRun } from "@webiny/api-workflows/domain/review/types.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import {
    EDITOR,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { scriptTargetReads } from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const ACTION = { action: "view a step run" };

/** The seeded current attempt of the automation step (`seeds.ts`): task `task-old`. */
const CURRENT_TASK_ID = "task-old";
const CURRENT_STARTED = "2026-10-13T10:00:00.000Z";
const CURRENT_FINISHED = "2026-10-13T10:01:00.000Z";

/** An earlier attempt of the same step; its task is `task-earlier`. */
const EARLIER_RUN: ReviewStepRun = {
    taskId: "task-earlier",
    startedOn: "2026-10-13T09:00:00.000Z",
    finishedOn: "2026-10-13T09:05:00.000Z",
    outcome: "failed",
    reason: "The automation was aborted."
};

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER
};

/** Stores the review with the given task ids on its steps and the given earlier runs. */
const withTasks = async (
    context: CmsContext,
    review: ReviewData,
    taskId: string,
    runs: ReviewStepRun[]
): Promise<ReviewData> => {
    const steps = review.steps.map(step => ({ ...step, taskId, runs }));
    return expectOk(await context.container.resolve(ReviewRepository).save({ ...review, steps }));
};

/**
 * Admin stores the pages workflow and REQUESTER asks for three reviews, each with a failed
 * automation step: "Page A" (root; current task `task-old` after the earlier run `task-earlier`),
 * "Locked" in "folder-locked" and "Page B" (current task `task-bob`).
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const otherPage = await createPage(admin, { title: "Page B" });
    const seeded = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    const review = await withTasks(admin, seeded, CURRENT_TASK_ID, [EARLIER_RUN]);
    const lockedSeeded = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, lockedPage)
    );
    const lockedReview = await withTasks(admin, lockedSeeded, CURRENT_TASK_ID, []);
    const otherSeeded = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, otherPage)
    );
    const otherReview = await withTasks(admin, otherSeeded, "task-other", []);
    return { review, lockedReview, otherReview };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[]
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            registerTestAutomation,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            registerScriptedGetTask
        ]
    });
};

const readStepRun = (context: CmsContext, reviewId: string, taskId: string) => {
    return context.container
        .resolve(GetWebsiteBuilderPageReviewStepRunUseCase)
        .execute({ reviewId, stepId: STEP_ID, taskId });
};

describe("WB step run wrapper (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetScriptedTasks();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lets an editor read the current attempt", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID, { status: TaskDataStatus.FAILED });
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const info = expectOk(await readStepRun(editor, review.id, CURRENT_TASK_ID));

        expect(info).toEqual({
            taskId: CURRENT_TASK_ID,
            status: "failed",
            startedOn: CURRENT_STARTED,
            finishedOn: CURRENT_FINISHED,
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(engineCalls).toEqual(["GetReview", "GetReviewStepRun"]);
    });

    it("lets a viewer with reassign read an earlier attempt", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-earlier", { status: TaskDataStatus.ABORTED });
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const info = expectOk(await readStepRun(reassigner, review.id, "task-earlier"));

        expect(info).toEqual({
            taskId: "task-earlier",
            status: "aborted",
            startedOn: EARLIER_RUN.startedOn,
            finishedOn: EARLIER_RUN.finishedOn,
            iterations: 1,
            outcome: "failed",
            reason: "The automation was aborted."
        });
    });

    it("refuses the requester and a reader without editor or reassign, before the engine and the task", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID);
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const refusedRequester = await readStepRun(requester, review.id, CURRENT_TASK_ID);
        const refusedReviewer = await readStepRun(reviewer, review.id, CURRENT_TASK_ID);

        expect(refusedRequester.error?.code).toBe("Workflows/NotAuthorized");
        expect(refusedRequester.error?.data).toEqual(ACTION);
        expect(refusedRequester.error?.message).toBe("You are not allowed to view a step run.");
        expect(refusedReviewer.error?.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual(["GetReview", "GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("refuses an editor without read access to the page, before the engine and the task", async () => {
        const { lockedReview } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID);
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, lockedReview.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/NotAuthorized");
        expect(result.error?.data).toEqual(ACTION);
        expect(engineCalls).toEqual(["GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, cmsReview.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).toEqual(["GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await readStepRun(anonymous, review.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/NotAuthenticated");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers a task id that is not on the step with StepRunNotFound and reads no task", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-unknown");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, "task-unknown");

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(result.error?.data).toEqual({
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: "task-unknown"
        });
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers another review's task id with StepRunNotFound and reads no task", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-other");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, "task-other");

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers null when the task record is gone", async () => {
        const { review } = await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, CURRENT_TASK_ID);

        expect(expectOk(result)).toBeNull();
        expect(scriptedTaskReads.ids).toEqual([CURRENT_TASK_ID]);
    });

    it("fails with a persistence error when the task read throws (R87)", async () => {
        const { review } = await createScenario();
        scriptedTaskReads.failure = new Error("The task store is down.");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/Review/Persistence");
    });

    it("never returns the task's raw error, input or output (R146)", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID, {
            status: TaskDataStatus.FAILED,
            input: { reviewId: review.id, stepId: STEP_ID, secret: "SECRET-INPUT" },
            output: {
                idWaits: 0,
                state: { secret: "SECRET-STATE" },
                error: { message: "SECRET-RAW-ERROR" }
            }
        });
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const info = expectOk(await readStepRun(editor, review.id, CURRENT_TASK_ID));

        expect(Object.keys(info ?? {}).sort()).toEqual([
            "finishedOn",
            "iterations",
            "outcome",
            "reason",
            "startedOn",
            "status",
            "taskId"
        ]);
        expect(JSON.stringify(info)).not.toContain("SECRET");
    });
});
