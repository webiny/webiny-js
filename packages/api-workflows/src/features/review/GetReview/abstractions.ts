import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetReviewInput {
    id: string;
}

export interface IGetReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetReviewUseCaseErrors[keyof IGetReviewUseCaseErrors];

export interface IGetReviewUseCase {
    execute(input: GetReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Get one review. Viewer flags and read permissions arrive in phase 1b. */
export const GetReviewUseCase = createAbstraction<IGetReviewUseCase>("GetReviewUseCase");

export namespace GetReviewUseCase {
    export type Interface = IGetReviewUseCase;
    export type Input = GetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
