import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";
import { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandler } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";

export { createWebsocketsServer, attachWebsocketsServer } from "~/server/WebsocketsServer.js";
export type { IWebsocketsServer } from "~/server/types.js";
export * from "~/adapter/abstractions.js";
export * from "~/upgradeHandler/abstractions.js";
export * from "~/connectionManager/abstractions.js";

// Concrete implementations, exported for custom DI wiring (e.g. splitting the shared connection
// manager + adapter into the root container and the transport into the per-request stack).
export { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";
export { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
export { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";

export const createServerWebsockets = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        context.container.register(ServerWebsocketsTransport).inSingletonScope();
        context.container.register(NodeWsAdapter).inSingletonScope();
        context.container.register(DefaultUpgradeHandler).inSingletonScope();
        context.container.register(ServerConnectionManager).inSingletonScope();
    });
    plugin.name = "websockets.server.transport";
    return [plugin];
};
