import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewGateway } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";

export const WbReviewGateway = createAbstraction<IReviewGateway>(
    "WebsiteBuilder/Workflows/ReviewGateway"
);

export namespace WbReviewGateway {
    export type Interface = IReviewGateway;
}
