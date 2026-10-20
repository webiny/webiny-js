import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";

// The WB token the per-app review use cases still run on; Task 14 removes it (R356).
export const WbReviewGateway = createAbstraction<IReviewAppGateway>(
    "WebsiteBuilder/Workflows/ReviewGateway"
);

export namespace WbReviewGateway {
    export type Interface = IReviewAppGateway;
}
