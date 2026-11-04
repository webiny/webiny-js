import { createAbstraction } from "@webiny/feature/api";
import type { TaskClaim } from "./TaskClaim.js";

/**
 * Counts how often recovery has taken over a task without the task saving in between, so one that
 * keeps dying with its process is failed instead of resumed forever. Only the holder of the task's
 * claim records, so two processes never count the same takeover.
 */
export interface ITaskRecoveries {
    /**
     * Records one more takeover and resolves to the count, this one included. `savedOn` is when the
     * task last saved: when it differs from the previous takeover's, the task made progress and the
     * count starts over at 1.
     */
    record(target: TaskClaim.Target, savedOn: string): Promise<number>;
}

export const TaskRecoveries = createAbstraction<ITaskRecoveries>("BackgroundTasks/TaskRecoveries");

export namespace TaskRecoveries {
    export type Interface = ITaskRecoveries;
}
