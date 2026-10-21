import { createAbstraction } from "@webiny/feature/api";
import type { TaskClaim } from "./TaskClaim.js";

/**
 * Counts how often recovery has taken over a task, so one that keeps dying with its process is
 * failed instead of resumed forever. Only the holder of the task's claim records, so two processes
 * never count the same takeover.
 */
export interface ITaskRecoveries {
    /** Records one more takeover and resolves to the count, this one included. */
    record(target: TaskClaim.Target): Promise<number>;
}

export const TaskRecoveries = createAbstraction<ITaskRecoveries>("BackgroundTasks/TaskRecoveries");

export namespace TaskRecoveries {
    export type Interface = ITaskRecoveries;
}
