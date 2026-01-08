import { WebsocketsEventRoute } from "~/handler/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const createWebsocketsRouteConnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(WebsocketsEventRoute.connect, async params => {
        const { registry, event, response, getTenant, getIdentity } = params;

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

        await registry.register({
            identity: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            connectionId: event.requestContext.connectionId,
            tenant,
            domainName: event.requestContext.domainName,
            stage: event.requestContext.stage,
            connectedOn: getConnectedOn(event.requestContext.connectedAt)
        });

        return response.ok();
    });
    plugin.name = "websockets.route.connect.default";
    return plugin;
};
