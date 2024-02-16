import { SocketsEventRoute } from "~/handler/types";
import { SocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDisconnectPlugin = () => {
    return new SocketsRoutePlugin(SocketsEventRoute.disconnect, async params => {
        const { sockets, event } = params;
        await sockets.registry.unregister({
            connectionId: event.requestContext.connectionId
        });

        return {
            statusCode: 200
        };
    });
};
