import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";

export const WbReviewPageCacheWriter = createAbstraction<IReviewCacheWriter>(
    "WebsiteBuilder/Workflows/ReviewCacheWriter"
);

export namespace WbReviewPageCacheWriter {
    export type Interface = IReviewCacheWriter;
}
