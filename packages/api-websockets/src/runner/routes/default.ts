import type { WebsocketsRoute } from "~/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const DEFAULT: WebsocketsRoute = "default";

export const createWebsocketsRouteDefaultPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(DEFAULT, async params => {
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
