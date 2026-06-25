import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";

const DISCONNECT: WebsocketsRoute = "disconnect";

export const websocketsRouteDisconnect: WebsocketsRouteHandler.Interface = {
    route: DISCONNECT,
    async run({ registry, event, response }) {
        await registry.unregister({
            connectionId: event.context.connectionId
        });

        return response.ok();
    }
};
