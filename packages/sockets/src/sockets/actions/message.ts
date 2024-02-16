import { SocketsEventRoute } from "~/handler/types";
import { SocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteMessagePlugin = () => {
    return new SocketsRoutePlugin(SocketsEventRoute.message, async () => {
        return {
            statusCode: 200
        };
    });
};
