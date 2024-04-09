import { WebsocketsEventRoute } from "~/handler/types";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const createWebsocketsRouteConnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(WebsocketsEventRoute.connect, async params => {
        const { registry, event, response, getTenant, getLocale, getIdentity } = params;

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

        await registry.register({
            identity,
            connectionId: event.requestContext.connectionId,
            tenant,
            locale,
            domainName: event.requestContext.domainName,
            stage: event.requestContext.stage,
            connectedOn: getConnectedOn(event.requestContext.connectedAt)
        });

        return response.ok();
    });
    plugin.name = "websockets.route.connect.default";
    return plugin;
};
