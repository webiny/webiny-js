import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteDefaultPlugin = () => {
    const plugin = createSocketsRoutePlugin(SocketsEventRoute.default, async params => {
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

    plugin.name = "socketsRoute.default.default";
    return plugin;
};
