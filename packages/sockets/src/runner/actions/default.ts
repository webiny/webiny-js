import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDefaultPlugin = () => {
    return createSocketsRoutePlugin(SocketsEventRoute.default, async ({ response }) => {
        return response.ok();
    });
};
