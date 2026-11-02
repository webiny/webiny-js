import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";

export const CmsReviewRowProvider = createAbstraction<IReviewRowProvider>(
    "Cms/Workflows/ReviewRowProvider"
);

export namespace CmsReviewRowProvider {
    export type Interface = IReviewRowProvider;
}
