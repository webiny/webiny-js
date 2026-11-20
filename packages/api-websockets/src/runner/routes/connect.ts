import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";
import { CanAccessCurrentTenantUseCase } from "@webiny/api-core/features/security/CanAccessCurrentTenant/index.js";

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
        // On `$connect`, API Gateway accepts the socket on any 2xx, so every refusal needs a status.
        if (!tenant) {
            return response.error({
                statusCode: 400,
                message: "Missing tenant."
            });
        } else if (!identity) {
            return response.error({
                statusCode: 401,
                message: "Missing identity."
            });
        }

        /*
         * Caught here rather than left to the runner, which answers a thrown error with a 200 and
         * would open the socket.
         */
        try {
            /*
             * The tenant is whatever the client names, so a valid token alone would let a user of one
             * tenant receive another tenant's messages.
             */
            const canAccessTenant = await container
                .resolve(CanAccessCurrentTenantUseCase)
                .execute();
            if (!canAccessTenant) {
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
        } catch (ex) {
            return response.error({
                statusCode: 500,
                message: "Could not accept the connection.",
                error: {
                    message: ex.message,
                    code: ex.code
                }
            });
        }

        return response.ok();
    }
};
