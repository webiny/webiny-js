import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ListTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** The entry or page id, across all revisions. */
    targetId: string;
}

export interface IListTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListTargetReviewsUseCaseErrors[keyof IListTargetReviewsUseCaseErrors];

export interface IListTargetReviewsUseCase {
    execute(input: ListTargetReviewsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Every review of a target, all revisions, active or not. Internal (D132): used by the adapters'
 * move rule (R55).
 */
export const ListTargetReviewsUseCase = createAbstraction<IListTargetReviewsUseCase>(
    "ListTargetReviewsUseCase"
);

export namespace ListTargetReviewsUseCase {
    export type Interface = IListTargetReviewsUseCase;
    export type Input = ListTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
