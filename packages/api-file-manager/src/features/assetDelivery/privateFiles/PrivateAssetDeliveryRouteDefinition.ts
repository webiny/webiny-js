import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { AssetDeliveryRoute } from "~/delivery/AssetDeliveryRoute.js";

/*
 * Private files are delivered from `/private/*`: a private file requested via `/files/*` is
 * redirected here, and `PrivateFileAssetRequestResolver` only handles this prefix. Same handler as
 * `/files/*`, the resolvers pick the request apart by its path.
 */
class PrivateAssetDeliveryRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "private-asset-delivery";
    readonly method = "GET";
    readonly path = "/private/*";
    // Typed as the interface's field: inferred, the declaration would expose the handler's private
    // members, which an exported anonymous class type cannot carry.
    readonly handler: HttpRouteDefinition.Interface["handler"] = AssetDeliveryRoute;
}

export const PrivateAssetDeliveryRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: PrivateAssetDeliveryRouteDefinitionImpl,
    dependencies: []
});
