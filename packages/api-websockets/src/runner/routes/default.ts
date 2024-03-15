import { WebsocketsEventRoute } from "~/handler/types";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin";

export const createWebsocketsRouteDefaultPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(WebsocketsEventRoute.default, async params => {
        const { response, getIdentity, getLocale, getTenant } = params;
        const tenant = getTenant();
        const locale = getLocale();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!locale) {
            return response.error({
                message: "Missing locale."
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
