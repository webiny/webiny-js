import type { IReviewActionUseCases } from "./IReviewActionUseCases.js";
import type { IReviewCancelForDeleteUseCases } from "./IReviewCancelForDeleteUseCases.js";
import type { IReviewListUseCases } from "./IReviewListUseCases.js";
import type { IReviewReadUseCases } from "./IReviewReadUseCases.js";

/*
 * Everything the review views need from one app. Every method throws a `GraphQLOperationError` for a
 * server error or the transport `Error` as is (R204).
 */
export interface IReviewUseCases
    extends
        IReviewReadUseCases,
        IReviewActionUseCases,
        IReviewListUseCases,
        IReviewCancelForDeleteUseCases {}
