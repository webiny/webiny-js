import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTaskAbortParams {
    taskIds: string[];
    message: string;
}

export interface IReviewTaskAbortService {
    /**
     * Aborts the step run tasks, best effort: a failed or throwing abort is logged and never
     * propagates; the other ids are still aborted. An empty list makes no call.
     */
    abort(params: ReviewTaskAbortParams): Promise<void>;
}

/**
 * Shared by `ReviewSaver` (abort when the save fails, R143), the automation reach (abort when
 * `reachRun` fails after a trigger) and cancel and delete (R151).
 */
export const ReviewTaskAbortService =
    createAbstraction<IReviewTaskAbortService>("ReviewTaskAbortService");

export namespace ReviewTaskAbortService {
    export type Interface = IReviewTaskAbortService;
    export type Params = ReviewTaskAbortParams;
}
