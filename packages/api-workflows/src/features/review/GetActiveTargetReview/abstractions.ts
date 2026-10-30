import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetActiveTargetReviewInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetRevisionId: string;
}

export interface IGetActiveTargetReviewUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetActiveTargetReviewUseCaseErrors[keyof IGetActiveTargetReviewUseCaseErrors];

export interface IGetActiveTargetReviewUseCase {
    execute(input: GetActiveTargetReviewInput): Promise<Result<ReviewData | null, UseCaseError>>;
}

/**
 * The active review of a target revision as stored, or `null` (D23). Read only: unlike
 * `GetTargetReviewUseCase` it never runs stuck detection, so it never writes. Internal (D132):
 * for the app adapters' save block and publish rule (R53, R54), which run inside entry and page
 * before-events and only need to know whether a review blocks the action.
 */
export const GetActiveTargetReviewUseCase = createAbstraction<IGetActiveTargetReviewUseCase>(
    "GetActiveTargetReviewUseCase"
);

export namespace GetActiveTargetReviewUseCase {
    export type Interface = IGetActiveTargetReviewUseCase;
    export type Input = GetActiveTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData | null, UseCaseError>>;
}
