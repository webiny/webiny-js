import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewGateway } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";

export const CmsReviewGateway = createAbstraction<IReviewGateway>("Cms/Workflows/ReviewGateway");

export namespace CmsReviewGateway {
    export type Interface = IReviewGateway;
}
