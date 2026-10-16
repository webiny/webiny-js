import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";

export const CmsReviewCacheWriter = createAbstraction<IReviewCacheWriter>(
    "Cms/Workflows/ReviewCacheWriter"
);

export namespace CmsReviewCacheWriter {
    export type Interface = IReviewCacheWriter;
}
