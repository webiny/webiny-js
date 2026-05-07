import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WebsocketsContext as WebsocketsImplementation } from "./WebsocketsContext.js";
import { WebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistry } from "~/registry/abstractions/IWebsocketsConnectionRegistry.js";
import { WebsocketsTransport } from "~/transport/index.js";
import type { IWebsocketsTransport } from "~/transport/abstractions/IWebsocketsTransport.js";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";

export type * from "./abstractions/IWebsocketsContext.js";

export interface CreateWebsocketsContextParams {
    /**
     * Optional pre-built connection registry. When omitted, the DDB-backed
     * registry is built from `context.db.driver.documentClient` (the legacy
     * serverless behavior). Container deployments supply an in-memory
     * registry from `@webiny/api-websockets-memory`.
     */
    registry?: IWebsocketsConnectionRegistry;
    /**
     * Optional pre-built transport. When omitted, the AWS API Gateway
     * Management API transport is used. Container deployments supply a
     * different transport (no-op or a real WS server) — see
     * `@webiny/api-websockets-memory`.
     */
    transport?: IWebsocketsTransport;
}

export const createWebsocketsContext = (params: CreateWebsocketsContextParams = {}) => {
    const plugin = new ContextPlugin<Context>(async context => {
        const registry =
            params.registry ??
            // @ts-expect-error — legacy DDB driver shape; only present in
            // serverless deployments. Container deployments pass `registry`.
            new WebsocketsConnectionRegistry(context.db.driver.documentClient);

        const transport = params.transport ?? new WebsocketsTransport();

        context.websockets = new WebsocketsImplementation(registry, transport);

        context.container.registerInstance(WebsocketService, context.websockets);
    });

    plugin.name = "websockets.context";

    return plugin;
};
