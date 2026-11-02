import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { CancelReviewInput } from "../shared/types.js";

export interface ICancelReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = ICancelReviewUseCaseErrors[keyof ICancelReviewUseCaseErrors];

export interface ICancelReviewUseCase {
    execute(input: CancelReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Cancel an in-progress review; the target is unlocked (D25, D75). */
export const CancelReviewUseCase = createAbstraction<ICancelReviewUseCase>("CancelReviewUseCase");

export namespace CancelReviewUseCase {
    export type Interface = ICancelReviewUseCase;
    export type Input = CancelReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
