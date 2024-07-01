import { WebsocketsEventRoute } from "~/handler/types";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin";

export const createWebsocketsRouteDisconnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(WebsocketsEventRoute.disconnect, async params => {
        const { registry, event, response } = params;
        await registry.unregister({
            connectionId: event.requestContext.connectionId
        });

        return response.ok();
    });
    plugin.name = "websockets.route.disconnect.default";
    return plugin;
};
