import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";

const CONNECT: WebsocketsRoute = "connect";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const websocketsRouteConnect: WebsocketsRouteHandler.Interface = {
    route: CONNECT,
    async run({ registry, event, response, getTenant, getIdentity }) {
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
            connectionId: event.context.connectionId,
            tenant,
            endpoint: event.context.endpoint,
            connectedOn: getConnectedOn(event.context.connectedAt)
        });

        return response.ok();
    }
};
