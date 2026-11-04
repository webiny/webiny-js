import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";

/*
 * The review of a content revision with the viewer's flags, or `null` when the revision has none
 * (a value, not an error). Throws a `GraphQLOperationError` for a server error and the transport
 * `Error` as is (R360).
 */
export interface IGetTargetReviewUseCase {
    execute(params: ReviewTarget): Promise<ReviewWithFlags | null>;
}

export const GetTargetReviewUseCase = createAbstraction<IGetTargetReviewUseCase>(
    "Workflows/GetTargetReviewUseCase"
);

export namespace GetTargetReviewUseCase {
    export type Interface = IGetTargetReviewUseCase;
    export type Params = ReviewTarget;
}
