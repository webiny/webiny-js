import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";
import { AuthorizationContext } from "@webiny/api-core/features/security/authorization/AuthorizationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

const CONNECT: WebsocketsRoute = "connect";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const websocketsRouteConnect: WebsocketsRouteHandler.Interface = {
    route: CONNECT,
    async run({ registry, event, container, response, getTenant, getIdentity }) {
        const tenant = getTenant();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!identity) {
            // On `$connect`, API Gateway accepts the socket on any 2xx.
            return response.error({
                statusCode: 401,
                message: "Missing identity."
            });
        }

        /*
         * The tenant is whatever the client names, so a valid token alone would let a user of one
         * tenant receive another tenant's messages. No permissions in this tenant means no access,
         * the same outcome an HTTP request gets.
         */
        const permissions = await container
            .resolve(AuthorizationContext)
            .loadPermissions(container.resolve(IdentityContext).getIdentity());
        if (permissions.length === 0) {
            return response.error({
                statusCode: 403,
                message: "No access to this tenant."
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
