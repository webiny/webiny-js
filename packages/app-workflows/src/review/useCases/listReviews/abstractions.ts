import { createAbstraction } from "@webiny/feature/admin";
import type { ListReviewsGatewayParams } from "~/review/gateway/params.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";

export type ListReviewsUseCaseParams = ListReviewsGatewayParams;

/*
 * One page of the app's Content Reviews list; a missing meta reads as no more items. Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IListReviewsUseCase {
    execute(params: ListReviewsUseCaseParams): Promise<ReviewListPage>;
}

export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>(
    "Workflows/ListReviewsUseCase"
);

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Params = ListReviewsUseCaseParams;
}
