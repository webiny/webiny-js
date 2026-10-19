import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";

export const WbReviewContentAdapter = createAbstraction<IReviewContentAdapter>(
    "WebsiteBuilder/Workflows/ReviewContentAdapter"
);

export namespace WbReviewContentAdapter {
    export type Interface = IReviewContentAdapter;
}
