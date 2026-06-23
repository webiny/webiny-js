import type { WebsocketsRoute } from "~/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const DISCONNECT: WebsocketsRoute = "disconnect";

export const createWebsocketsRouteDisconnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(DISCONNECT, async params => {
        const { registry, event, response } = params;
        await registry.unregister({
            connectionId: event.context.connectionId
        });

        return response.ok();
    });
    plugin.name = "websockets.route.disconnect.default";
    return plugin;
};
