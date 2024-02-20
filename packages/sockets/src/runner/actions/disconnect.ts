import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDisconnectPlugin = () => {
    const plugin = createSocketsRoutePlugin(SocketsEventRoute.disconnect, async params => {
        const { registry, event, response } = params;
        await registry.unregister({
            connectionId: event.requestContext.connectionId
        });

        return response.ok();
    });
    plugin.name = "socketsRoute.disconnect.default";
    return plugin;
};
