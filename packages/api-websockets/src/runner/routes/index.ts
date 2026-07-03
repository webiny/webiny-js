import type { Container } from "@webiny/di";
import { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";
import { websocketsRouteConnect } from "./connect.js";
import { websocketsRouteDisconnect } from "./disconnect.js";
import { websocketsRouteDefault } from "./default.js";

export { websocketsRouteConnect, websocketsRouteDisconnect, websocketsRouteDefault };

/**
 * Registers the built-in WebSocket route handlers (connect, disconnect, default) as
 * WebsocketsRouteHandler implementations. Custom routes can be added the same way:
 * `container.registerInstance(WebsocketsRouteHandler, { route, run })`.
 */
export const registerWebsocketsRoutes = (container: Container): void => {
    container.registerInstance(WebsocketsRouteHandler, websocketsRouteConnect);
    container.registerInstance(WebsocketsRouteHandler, websocketsRouteDisconnect);
    container.registerInstance(WebsocketsRouteHandler, websocketsRouteDefault);
};
