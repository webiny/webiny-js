import { createAbstraction } from "@webiny/feature/api";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";

/**
 * Drives a triggered task to completion inside this process: runs one iteration, waits as long as
 * the iteration asks, and runs the next until the task stops asking to continue. The standalone
 * counterpart of the Step Functions state machine that drives a task on AWS.
 *
 * `start` returns at once. The task runs after the request that triggered it has finished.
 */
export interface ITaskLoop {
    start(event: IBackgroundTaskEvent): void;
}

/**
 * The status an iteration answers when another process holds the task's claim. That process drives
 * the task, so this loop stops without it being an error.
 */
export const CLAIMED_ELSEWHERE_STATUS = "claimed-elsewhere";

export const TaskLoop = createAbstraction<ITaskLoop>("BackgroundTasks/TaskLoop");

export namespace TaskLoop {
    export type Interface = ITaskLoop;
}
