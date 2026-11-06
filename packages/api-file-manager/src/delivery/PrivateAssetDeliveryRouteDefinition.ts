import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { AssetDeliveryRoute } from "./AssetDeliveryRoute.js";

/*
 * Private files are served from `/private/*` through the same pipeline as `/files/*`.
 * `PrivateFileAssetRequestResolver` marks these requests as private, and the private files
 * processor authorizes the caller (from the `Authorization` / `x-webiny-authorization` header)
 * and sends `cache-control: private`.
 */
class PrivateAssetDeliveryRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "private-asset-delivery";
    readonly method = "GET";
    readonly path = "/private/*";
    readonly handler: HttpRouteDefinition.Interface["handler"] = AssetDeliveryRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const PrivateAssetDeliveryRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: PrivateAssetDeliveryRouteDefinitionImpl,
    dependencies: []
});
