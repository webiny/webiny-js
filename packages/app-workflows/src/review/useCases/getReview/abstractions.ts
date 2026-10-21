import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewWithFlags } from "~/review/domain/types.js";

export interface GetReviewUseCaseParams {
    namespace: string;
    reviewId: string;
}

/*
 * One review with the viewer's flags. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IGetReviewUseCase {
    execute(params: GetReviewUseCaseParams): Promise<ReviewWithFlags>;
}

export const GetReviewUseCase = createAbstraction<IGetReviewUseCase>("Workflows/GetReviewUseCase");

export namespace GetReviewUseCase {
    export type Interface = IGetReviewUseCase;
    export type Params = GetReviewUseCaseParams;
}
