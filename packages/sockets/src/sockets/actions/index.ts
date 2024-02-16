import { createSocketsRouteConnectPlugin } from "./connect";
import { createSocketsRouteMessagePlugin } from "./message";
import { createSocketsRouteDisconnectPlugin } from "./disconnect";

export const createSocketsRoutePlugins = () => {
    return [
        createSocketsRouteConnectPlugin(),
        createSocketsRouteDisconnectPlugin(),
        createSocketsRouteMessagePlugin()
    ];
};
