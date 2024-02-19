import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDefaultPlugin = () => {
    return createSocketsRoutePlugin(SocketsEventRoute.default, async ({ next }) => {
        const result = await next();
        return {
            ...result,
            statusCode: 200
        };
    });
};
