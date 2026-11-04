import type { Container } from "@webiny/di";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Result } from "@webiny/feature/api";
import { BackgroundTaskPersistenceError } from "@webiny/background-tasks/api/domain/errors.js";
import { TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";

export interface ScriptedTaskParams {
    status?: TaskDataStatus;
    iterations?: number;
    startedOn?: string;
    finishedOn?: string;
    input?: TaskService.Task["input"];
    output?: TaskService.Task["output"];
}

export interface ScriptedTaskReads {
    /** Fails every read with a persistence error when set. */
    failure: Error | null;
    /** Every task id that was read, in order. */
    ids: string[];
}

const NOW = "2026-10-13T10:00:00.000Z";

const tasks = new Map<string, TaskService.Task>();

export const scriptedTaskReads: ScriptedTaskReads = { failure: null, ids: [] };

/** Stores a task the scripted read answers with. */
export const putScriptedTask = (id: string, params: ScriptedTaskParams = {}): void => {
    tasks.set(id, {
        id,
        name: "Workflow step: Check links",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input ?? { reviewId: "review", stepId: "step-1" },
        output: params.output,
        iterations: params.iterations ?? 1,
        taskStatus: params.status ?? TaskDataStatus.FAILED,
        eventResponse: undefined,
        startedOn: params.startedOn,
        finishedOn: params.finishedOn,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "user-requester", displayName: "Rita Requester", type: "admin" }
    });
};

/** Clears the stored tasks, the failure and the recorded reads; call it in `beforeEach`. */
export const resetScriptedTasks = (): void => {
    tasks.clear();
    scriptedTaskReads.failure = null;
    scriptedTaskReads.ids.length = 0;
};

class ScriptedGetTask implements GetTaskUseCase.Interface {
    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): GetTaskUseCase.Return<I, O> {
        scriptedTaskReads.ids.push(id);
        if (scriptedTaskReads.failure) {
            return Result.fail(BackgroundTaskPersistenceError.from(scriptedTaskReads.failure));
        }
        const task = tasks.get(id);
        if (!task) {
            return Result.fail(new TaskNotFoundError());
        }
        return Result.ok(task as unknown as TaskService.Task<I, O>);
    }
}

/** Replaces the context's task read (`legacyPlugins`: function plugins run last, last wins). */
export const registerScriptedGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new ScriptedGetTask());
};
