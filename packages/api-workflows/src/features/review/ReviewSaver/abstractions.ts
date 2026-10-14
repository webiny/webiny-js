import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewTargetSyncError } from "~/domain/review/errors.js";

export type ReviewSaverError = ReviewPersistenceError | ReviewTargetSyncError;

export interface IReviewSaver {
    save(review: Review): Promise<Result<ReviewData, ReviewSaverError>>;
}

/**
 * The single save path for reviews (R10, D19, D52): prepare the review-level fields, persist
 * (create or update), write the facts' assignment records (R117; a failed write is only logged),
 * sync `system.workflow`, then publish one event per recorded fact. A failed sync keeps the save
 * and the events and returns `ReviewTargetSyncError` (R16). A failed persist aborts the step run
 * tasks started by the recorded reaches (R143) before returning the persistence error.
 */
export const ReviewSaver = createAbstraction<IReviewSaver>("ReviewSaver");

export namespace ReviewSaver {
    export type Interface = IReviewSaver;
    export type Error = ReviewSaverError;
    export type Return = Promise<Result<ReviewData, ReviewSaverError>>;
}
