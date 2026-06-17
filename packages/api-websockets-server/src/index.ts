import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";
import { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandler } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";

export { createWebsocketsServer, attachWebsocketsServer } from "~/server/WebsocketsServer.js";
export type { IWebsocketsServer } from "~/server/types.js";
export * from "~/abstractions.js";

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
