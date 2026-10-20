import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewGateway } from "../CmsReviewGateway/CmsReviewGateway.js";

/*
 * A bridge (R356): `CmsReviewGateway` is still bound to the CMS token that the old review use
 * cases run on, and `createImplementation` stores one abstraction on a class, so the shared
 * `ReviewAppGateway` binding goes on an empty subclass. Task 14 binds `CmsReviewGateway` itself
 * and deletes this file.
 */
class CmsReviewAppGatewayImpl extends CmsReviewGateway implements GatewayAbstraction.Interface {}

export const CmsReviewAppGateway = GatewayAbstraction.createImplementation({
    implementation: CmsReviewAppGatewayImpl,
    dependencies: [MainGraphQLClient]
});
