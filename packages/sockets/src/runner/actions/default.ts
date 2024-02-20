import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDefaultPlugin = () => {
    const plugin = createSocketsRoutePlugin(SocketsEventRoute.default, async ({ response }) => {
        return response.ok();
    });

    plugin.name = "socketsRoute.default.default";
    return plugin;
};
