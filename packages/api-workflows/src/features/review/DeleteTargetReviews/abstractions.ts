import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface DeleteTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /**
     * The deleted targets (entry or page ids) of the namespace; one call for any number of
     * targets (delete multiple). An empty list deletes nothing.
     */
    targetIds: string[];
    /** Only this revision's reviews; every revision of the targets when omitted. */
    targetRevisionId?: string | null;
}

export interface DeleteTargetReviewsResult {
    deletedReviewIds: string[];
}

export interface IDeleteTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IDeleteTargetReviewsUseCaseErrors[keyof IDeleteTargetReviewsUseCaseErrors];

export interface IDeleteTargetReviewsUseCase {
    execute(
        input: DeleteTargetReviewsInput
    ): Promise<Result<DeleteTargetReviewsResult, UseCaseError>>;
}

/**
 * Deletes the reviews of permanently deleted targets and their assignment-log records (spec 4.3,
 * 9.3, R56). The reviews of all targets are listed with one `listByTargets` call. Internal (D132): called by the app adapters' after-delete handlers, after the target
 * is already permanently deleted.
 *
 * Deletes every review it finds, in progress or not: it never cancels. Callers refuse the delete
 * while a review is in progress (D134, R73), so only finished reviews normally remain; reviews
 * left behind by a deleted workflow are removed too.
 *
 * Also cleans up the background task of every step attempt (`taskId` and `runs[].taskId`), which
 * workflows keeps until the review is deleted (R256). A cleanup that fails is logged, never fails
 * the delete.
 */
export const DeleteTargetReviewsUseCase = createAbstraction<IDeleteTargetReviewsUseCase>(
    "DeleteTargetReviewsUseCase"
);

export namespace DeleteTargetReviewsUseCase {
    export type Interface = IDeleteTargetReviewsUseCase;
    export type Input = DeleteTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<DeleteTargetReviewsResult, UseCaseError>>;
}
