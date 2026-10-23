import { createAbstraction } from "@webiny/feature/api";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";

/**
 * Drives the background tasks of this process to completion. For each task it runs one iteration,
 * waits as long as the iteration asks, and runs the next until the task stops asking to continue.
 * The standalone counterpart of the Step Functions state machine that drives a task on AWS.
 *
 * `start` returns at once. The task runs after the request that triggered it has finished.
 */
export interface IBackgroundTasksLoop {
    /** Ignored for a task already being driven, and once the process is shutting down. */
    start(event: IBackgroundTaskEvent): void;
    /**
     * Stops driving tasks: running iterations are asked to save and hand their task back, and nothing
     * new starts. Resolves once they have, or after `timeoutMs`, whichever comes first.
     */
    stop(timeoutMs: number): Promise<void>;
}

/**
 * The status an iteration answers when another process holds the task's claim. That process drives
 * the task, so driving it here stops without it being an error.
 */
export const CLAIMED_ELSEWHERE_STATUS = "claimed-elsewhere";

/**
 * The status an iteration answers when it stopped early because the process is shutting down. Its claim
 * is released, so another process takes the task over at its next recovery sweep.
 */
export const HANDED_BACK_STATUS = "handed-back";

export const BackgroundTasksLoop = createAbstraction<IBackgroundTasksLoop>(
    "BackgroundTasks/BackgroundTasksLoop"
);

export namespace BackgroundTasksLoop {
    export type Interface = IBackgroundTasksLoop;
}
