import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ListReviewsByTargetsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** Entry or page ids (not revision ids), across all revisions; an empty list lists nothing. */
    targetIds: string[];
}

export interface IListReviewsByTargetsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListReviewsByTargetsUseCaseErrors[keyof IListReviewsByTargetsUseCaseErrors];

export interface IListReviewsByTargetsUseCase {
    execute(input: ListReviewsByTargetsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Every review of any of these targets of one namespace, all revisions, active or not, confirmed
 * from primary storage (R18). One query per 100 target ids and one batch read per page, whatever
 * the number of targets (Q79). Internal (D132): used by the adapters' bulk checks (blocking
 * reviews, delete multiple).
 */
export const ListReviewsByTargetsUseCase = createAbstraction<IListReviewsByTargetsUseCase>(
    "ListReviewsByTargetsUseCase"
);

export namespace ListReviewsByTargetsUseCase {
    export type Interface = IListReviewsByTargetsUseCase;
    export type Input = ListReviewsByTargetsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
