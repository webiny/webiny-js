import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { abortedTasks, fakeTaskFaults, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    captureLoggedErrors,
    loggedErrors,
    loggedInfos
} from "~tests/__helpers/CapturingLogger.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import {
    DEFAULT_AUTOMATION_MAX_ITERATIONS,
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_STUCK_GRACE_MS,
    STEP_RUN_TASK_DEFINITION_ID,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES
} from "~/features/stepRun/constants.js";

const createService = async () => {
    const { context } = await createContextHandler({ setup: captureLoggedErrors });
    return context.container.resolve(ReviewTaskAbortService);
};

describe("ReviewTaskAbortService (D57, R143, R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
    });

    it("aborts every task id with the message", async () => {
        const service = await createService();

        await service.abort({
            taskIds: ["task-1", "task-2"],
            message: "The review was cancelled."
        });

        expect(abortedTasks).toEqual([
            { id: "task-1", message: "The review was cancelled." },
            { id: "task-2", message: "The review was cancelled." }
        ]);
        expect(loggedErrors).toEqual([]);
    });

    it("makes no call for an empty list", async () => {
        const service = await createService();

        await service.abort({ taskIds: [], message: "The review was cancelled." });

        expect(abortedTasks).toEqual([]);
    });

    it("logs a failed abort, never throws, and still aborts the other ids", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "fail";

        await expect(
            service.abort({ taskIds: ["task-1", "task-2"], message: "The review was deleted." })
        ).resolves.toBeUndefined();

        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
        expect(loggedErrors[0].fields).toMatchObject({ taskId: "task-1" });
    });

    it("logs info, not an error, when the task had already ended", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "ended";

        await expect(
            service.abort({ taskIds: ["task-1"], message: "The review was deleted." })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([]);
        expect(loggedInfos).toEqual(["The step run task had already ended."]);
    });

    it("logs info, not an error, when the task is gone because it cleaned itself up (R179)", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "gone";

        await expect(
            service.abort({ taskIds: ["task-1"], message: "The review was cancelled." })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([]);
        expect(loggedInfos).toEqual(["The step run task had already ended."]);
    });

    it("logs a throwing abort, never throws, and still aborts the other ids", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "throw";

        await expect(
            service.abort({ taskIds: ["task-1", "task-2"], message: "The review was deleted." })
        ).resolves.toBeUndefined();

        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
        expect(loggedErrors[1].fields).toMatchObject({ taskId: "task-2" });
    });
});

describe("step run constants (R142, R143, R145)", () => {
    it("has the contract values", () => {
        expect(STEP_RUN_TASK_DEFINITION_ID).toBe("workflowsStepRun");
        expect(STEP_RUN_MAX_ITERATIONS).toBe(10000);
        expect(STEP_RUN_TASKID_WAIT_TRIES).toBe(3);
        expect(STEP_RUN_TASKID_WAIT_SECONDS).toBe(2);
        expect(DEFAULT_AUTOMATION_MAX_ITERATIONS).toBe(50);
        expect(STEP_RUN_STUCK_GRACE_MS).toBe(300000);
    });
});
