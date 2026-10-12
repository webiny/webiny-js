import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface DeleteTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's reviews; every revision of the target when omitted. */
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
 * Deletes the reviews of a permanently deleted target and their assignment-log records (spec 4.3,
 * 9.3, R56). Internal (D132): called by the app adapters' after-delete handlers.
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
