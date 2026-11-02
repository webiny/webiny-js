import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Result } from "@webiny/feature/api";
import { BackgroundTaskPersistenceError } from "@webiny/background-tasks/api/domain/errors.js";
import { TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { requester } from "./fixtures.js";

const NOW = "2026-10-09T10:00:00.000Z";

/**
 * Task reads from a map of task id to status. `calls` records every id that was read and
 * `failure`, when set, fails every read with a persistence error. Reset it with `reset()` in `beforeEach`.
 */
export class FakeGetTask implements GetTaskUseCase.Interface {
    public readonly calls: string[] = [];
    public failure: Error | null = null;
    private readonly tasks = new Map<string, TaskService.Task>();

    /**
     * `createdById` defaults to the requester: the trigger runs as the requester (R149).
     * `finishedOn` defaults to a time long past the stuck grace (R152); pass a recent one to test
     * the grace.
     */
    public set(
        id: string,
        status: TaskDataStatus,
        createdById: string = requester.id,
        finishedOn: string = NOW
    ): void {
        this.tasks.set(id, {
            id,
            name: "Workflow step: Check links",
            definitionId: "workflowsStepRun",
            executionName: "",
            input: {},
            iterations: 1,
            taskStatus: status,
            eventResponse: undefined,
            finishedOn,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: createdById, displayName: "Rita Requester", type: "admin" }
        });
    }

    /** Stores a task as given, for tests that need times, a run count, an input or an output. */
    public put(task: TaskService.Task): void {
        this.tasks.set(task.id, task);
    }

    public reset(): void {
        this.calls.length = 0;
        this.failure = null;
        this.tasks.clear();
    }

    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): GetTaskUseCase.Return<I, O> {
        this.calls.push(id);
        if (this.failure) {
            return Result.fail(BackgroundTaskPersistenceError.from(this.failure));
        }
        const task = this.tasks.get(id);
        if (!task) {
            return Result.fail(new TaskNotFoundError());
        }
        return Result.ok(task as unknown as TaskService.Task<I, O>);
    }
}

export const fakeGetTask = new FakeGetTask();
