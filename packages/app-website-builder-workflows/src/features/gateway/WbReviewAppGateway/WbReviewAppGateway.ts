import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { WbReviewGateway } from "../WbReviewGateway/WbReviewGateway.js";

/*
 * A bridge (R356): `WbReviewGateway` is still bound to the WB token that the old review use cases
 * run on, and `createImplementation` stores one abstraction on a class, so the shared
 * `ReviewAppGateway` binding goes on an empty subclass. Task 14 binds `WbReviewGateway` itself and
 * deletes this file.
 */
class WbReviewAppGatewayImpl extends WbReviewGateway implements GatewayAbstraction.Interface {}

export const WbReviewAppGateway = GatewayAbstraction.createImplementation({
    implementation: WbReviewAppGatewayImpl,
    dependencies: [MainGraphQLClient]
});
