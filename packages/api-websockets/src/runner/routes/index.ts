import { createWebsocketsRouteConnectPlugin } from "./connect";
import { createWebsocketsRouteDefaultPlugin } from "./default";
import { createWebsocketsRouteDisconnectPlugin } from "./disconnect";

export const createWebsocketsRoutePlugins = () => {
    return [
        createWebsocketsRouteConnectPlugin(),
        createWebsocketsRouteDisconnectPlugin(),
        createWebsocketsRouteDefaultPlugin()
    ];
};
