import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const createSocketsRouteConnectPlugin = () => {
    const plugin = createSocketsRoutePlugin(SocketsEventRoute.connect, async params => {
        const { registry, event, response } = params;

        await registry.register({
            identity: event.data.identity,
            connectionId: event.requestContext.connectionId,
            tenant: event.data.tenant,
            locale: event.data.locale,
            domainName: event.requestContext.domainName,
            stage: event.requestContext.stage,
            connectedOn: getConnectedOn(event.requestContext.connectedAt)
        });

        return response.ok();
    });
    plugin.name = "socketsRoute.connect.default";
    return plugin;
};
