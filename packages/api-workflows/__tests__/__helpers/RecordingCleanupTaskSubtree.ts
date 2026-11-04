import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { abortedTasks } from "./FakeTaskService.js";

export interface CleanupCall {
    taskId: string;
    /** How many tasks had been aborted when the cleanup was called (abort comes first, R256). */
    abortsSoFar: number;
}

/**
 * Stands in for the background-tasks cleanup, which the test containers do not register: records
 * every task id it is asked to clean up, and rejects for the ids in `failFor`, which the real
 * use case never does, to prove a throwing decorator cannot fail a review delete. Reset it with
 * `reset()` in `beforeEach`.
 */
export class RecordingCleanupTaskSubtree implements CleanupTaskSubtreeUseCase.Interface {
    public readonly calls: CleanupCall[] = [];
    public readonly failFor = new Set<string>();

    public async execute(taskId: string): Promise<void> {
        this.calls.push({ taskId, abortsSoFar: abortedTasks.length });
        if (this.failFor.has(taskId)) {
            throw new Error("The task store is down.");
        }
    }

    public reset(): void {
        this.calls.length = 0;
        this.failFor.clear();
    }
}

export const recordingCleanup = new RecordingCleanupTaskSubtree();
