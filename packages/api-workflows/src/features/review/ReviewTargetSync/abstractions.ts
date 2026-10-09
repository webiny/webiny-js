import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewSystemWorkflow } from "~/domain/review/types.js";

export interface ReviewTargetSyncParams {
    /** The review as persisted. */
    review: ReviewData;
    /** The new `system.workflow` value; `null` unlocks the target (cancel, D75). */
    systemWorkflow: ReviewSystemWorkflow | null;
}

export interface IReviewTargetSync {
    /** Fails with the adapter's error; the review stays saved (R16). */
    sync(params: ReviewTargetSyncParams): Promise<Result<void, Error>>;
}

/**
 * Writes `system.workflow` on the target after every review save (spec 4.5, D52). 1a registers a
 * no-op; phase 2 registers the target adapters' implementation (`UpdateEntrySystemUseCase`).
 */
export const ReviewTargetSync = createAbstraction<IReviewTargetSync>("ReviewTargetSync");

export namespace ReviewTargetSync {
    export type Interface = IReviewTargetSync;
    export type Params = ReviewTargetSyncParams;
    export type Return = Promise<Result<void, Error>>;
}
