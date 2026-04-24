import { WebsocketsEventRoute } from "~/handler/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

export const createWebsocketsRouteDefaultPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(WebsocketsEventRoute.default, async params => {
        const { response, getIdentity, getTenant } = params;
        const tenant = getTenant();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!identity) {
            return response.error({
                message: "Missing identity."
            });
        }

        return response.ok();
    });

    plugin.name = "websockets.route.default.default";
    return plugin;
};
