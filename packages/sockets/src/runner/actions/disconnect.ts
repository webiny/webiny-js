import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDisconnectPlugin = () => {
    return createSocketsRoutePlugin(SocketsEventRoute.disconnect, async params => {
        const { registry, event, next } = params;
        const result = await next();
        await registry.unregister({
            connectionId: event.requestContext.connectionId
        });

        return {
            ...result,
            statusCode: 200
        };
    });
};
