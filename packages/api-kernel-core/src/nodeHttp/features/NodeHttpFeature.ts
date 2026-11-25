import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "~/index.js";
import { NodeHttpInputType } from "~/nodeHttp/inputTypes/NodeHttpInputType.js";
import { NodeHttpRouterHandler } from "~/nodeHttp/handlers/NodeHttpRouterHandler.js";

/**
 * Registers the transport-only Node HTTP server infrastructure:
 * - NodeHttpInputType (recognises an `IncomingMessage`)
 * - HttpFeature (HttpRouter + CorsHeadersDecorator)
 * - NodeHttpRouterHandler (terminal: translates IncomingMessage → IHttpRequest, routes via HttpRouter)
 *
 * Auth/tenant establishment (the extract→load decorators, which depend on api-core) is NOT here —
 * it lives in the composition layer (@webiny/api-composition-standalone), mirroring how the AWS
 * ApiGatewayFeature keeps api-kernel-aws free of any api-* (domain) dependency.
 */
export const NodeHttpFeature = createFeature({
    name: "NodeHttp",
    register(container: Container) {
        container.register(NodeHttpInputType);
        HttpFeature.register(container);
        container.register(NodeHttpRouterHandler);
    }
});
