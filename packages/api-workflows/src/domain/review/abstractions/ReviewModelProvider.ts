import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IReviewModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowReview` model on demand. */
export const ReviewModelProvider = createAbstraction<IReviewModelProvider>("ReviewModelProvider");

export namespace ReviewModelProvider {
    export type Interface = IReviewModelProvider;
}
