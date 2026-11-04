import { createAbstraction } from "@webiny/feature/api";

export interface ITaskClaimTarget {
    tenant: string;
    taskId: string;
}

/**
 * Which process runs a task. Every process can see every task, so before one runs a task it claims
 * it, and only one claim can be held at a time. A claim expires unless its owner keeps extending it,
 * which is how the tasks of a process that died become free again.
 *
 * Each method resolves to whether this process holds the claim afterwards. A storage failure
 * rejects: the caller cannot tell whether it holds the claim, so it must not run the task.
 */
export interface ITaskClaim {
    /** Claims the task when nobody holds it, an expired claim counting as nobody. */
    take(target: ITaskClaimTarget, ttlMs: number): Promise<boolean>;
    /** Extends a claim this process holds; `false` when it no longer does. */
    keep(target: ITaskClaimTarget, ttlMs: number): Promise<boolean>;
    /** Drops a claim this process holds, and leaves anyone else's alone. */
    release(target: ITaskClaimTarget): Promise<void>;
}

export const TaskClaim = createAbstraction<ITaskClaim>("BackgroundTasks/TaskClaim");

export namespace TaskClaim {
    export type Interface = ITaskClaim;
    export type Target = ITaskClaimTarget;
}
