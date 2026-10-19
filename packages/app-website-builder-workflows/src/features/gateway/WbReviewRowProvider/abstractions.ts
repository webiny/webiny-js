import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";

export const WbReviewRowProvider = createAbstraction<IReviewRowProvider>(
    "WebsiteBuilder/Workflows/ReviewRowProvider"
);

export namespace WbReviewRowProvider {
    export type Interface = IReviewRowProvider;
}
