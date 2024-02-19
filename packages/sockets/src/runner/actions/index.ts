import { createSocketsRouteConnectPlugin } from "./connect";
import { createSocketsRouteDefaultPlugin } from "./default";
import { createSocketsRouteDisconnectPlugin } from "./disconnect";

export const createSocketsRoutePlugins = () => {
    return [
        createSocketsRouteConnectPlugin(),
        createSocketsRouteDisconnectPlugin(),
        createSocketsRouteDefaultPlugin()
    ];
};
