import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";

export const CmsReviewContentAdapter = createAbstraction<IReviewContentAdapter>(
    "Cms/Workflows/ReviewContentAdapter"
);

export namespace CmsReviewContentAdapter {
    export type Interface = IReviewContentAdapter;
}
