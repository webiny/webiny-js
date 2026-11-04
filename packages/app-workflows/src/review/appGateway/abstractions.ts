import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewAppGateway } from "./IReviewAppGateway.js";

/*
 * The review gateway of one app (R347). The CMS and the Website Builder each register their class
 * under this one token, so both coexist; `ReviewGateway` collects them and routes every call.
 */
export const ReviewAppGateway = createAbstraction<IReviewAppGateway>("Workflows/ReviewAppGateway");

export namespace ReviewAppGateway {
    export type Interface = IReviewAppGateway;
}
