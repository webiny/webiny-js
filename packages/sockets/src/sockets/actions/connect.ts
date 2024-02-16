import { SocketsEventRoute } from "~/handler/types";
import { SocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";

export const createSocketsRouteConnectPlugin = () => {
    return new SocketsRoutePlugin(SocketsEventRoute.connect, async params => {
        const { sockets, event } = params;
        await sockets.registry.register({
            identity: event.data.identity.id,
            connectionId: event.requestContext.connectionId,
            tenant: event.data.tenant,
            locale: event.data.locale,
            domainName: event.requestContext.domainName,
            stage: event.requestContext.stage
        });

        return {
            statusCode: 200
        };
    });
};
