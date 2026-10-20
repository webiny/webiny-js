import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { EDITOR, REQUESTER } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER
};
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const TASK_ID = "task-old";

const GET_STEP_RUN = /* GraphQL */ `
    query GetStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        cms {
            getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId) {
                data {
                    taskId
                    status
                    startedOn
                    finishedOn
                    iterations
                    outcome
                    reason
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

/** A `/graphql` client as the identity, with the scripted task read and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            ...createExtraModelPlugins(),
            registerTestUsers,
            registerScriptedGetTask,
            countEngineCalls
        ]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, variables: Record<string, unknown>) => {
    const body = await client(GET_STEP_RUN, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms.getCmsEntryReviewStepRun;
};

/** Admin stores the workflow and REQUESTER asks for a review of "Ann"; its step failed as `task-old`. */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const seeded = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    const steps = seeded.steps.map(step => ({ ...step, taskId: TASK_ID, runs: [] }));
    const review = expectOk(
        await admin.container.resolve(ReviewRepository).save({ ...seeded, steps })
    );
    return { review };
};

describe("CMS step run GraphQL (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
        resetScriptedTasks();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("returns every field of the step run, and nothing of the raw task (R146)", async () => {
        const { review } = await createScenario();
        putScriptedTask(TASK_ID, {
            status: TaskDataStatus.FAILED,
            iterations: 4,
            input: { reviewId: review.id, stepId: STEP_ID, secret: "SECRET-INPUT" },
            output: {
                idWaits: 3,
                state: { secret: "SECRET-STATE" },
                error: { message: "SECRET-RAW-ERROR" }
            }
        });
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, { reviewId: review.id, stepId: STEP_ID, taskId: TASK_ID });

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            taskId: TASK_ID,
            status: "failed",
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(new Date(result.data.startedOn).toISOString()).toBe("2026-10-13T10:00:00.000Z");
        expect(new Date(result.data.finishedOn).toISOString()).toBe("2026-10-13T10:01:00.000Z");
        expect(JSON.stringify(result)).not.toContain("SECRET");
    });

    it("returns the refusal with code, message and data for a viewer without editor or reassign (R258)", async () => {
        const { review } = await createScenario();
        putScriptedTask(TASK_ID);
        const requester = clientFor(REQUESTER, CMS_WRITER);

        const result = await run(requester, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view a step run.",
                data: { action: "view a step run" }
            }
        });
        expect(engineCalls).not.toContain("GetReviewStepRun");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("returns null data and no error when the task is gone", async () => {
        const { review } = await createScenario();
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, { reviewId: review.id, stepId: STEP_ID, taskId: TASK_ID });

        expect(result).toEqual({ data: null, error: null });
    });

    it("returns StepRunNotFound with its data for a task id that is not on the step", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-unknown");
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: "task-unknown"
        });

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/StepRunNotFound",
            data: { reviewId: review.id, stepId: STEP_ID, taskId: "task-unknown" }
        });
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, {
            reviewId: wbReview.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
        expect(engineCalls).not.toContain("GetReviewStepRun");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = clientFor(null, []);

        const result = await run(anonymous, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });
});
