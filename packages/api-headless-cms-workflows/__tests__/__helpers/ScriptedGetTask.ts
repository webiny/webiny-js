import type { Container } from "@webiny/di";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";

export interface ScriptedTaskParams {
    status?: TaskDataStatus;
    iterations?: number;
    startedOn?: string;
    finishedOn?: string;
    input?: TaskService.Task["input"];
    output?: TaskService.Task["output"];
}

export interface ScriptedTaskReads {
    /** Thrown by every read when set. */
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
    ): Promise<TaskService.Task<I, O> | null> {
        scriptedTaskReads.ids.push(id);
        if (scriptedTaskReads.failure) {
            throw scriptedTaskReads.failure;
        }
        return (tasks.get(id) ?? null) as unknown as TaskService.Task<I, O> | null;
    }
}

/** Replaces the context's `NoopGetTask` (`legacyPlugins`: function plugins run last, last wins). */
export const registerScriptedGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new ScriptedGetTask());
};
