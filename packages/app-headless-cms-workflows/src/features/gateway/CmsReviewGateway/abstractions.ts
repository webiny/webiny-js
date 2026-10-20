import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";

// The CMS token the per-app review use cases still run on; Task 14 removes it (R356).
export const CmsReviewGateway = createAbstraction<IReviewAppGateway>("Cms/Workflows/ReviewGateway");

export namespace CmsReviewGateway {
    export type Interface = IReviewAppGateway;
}
