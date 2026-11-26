import { WebSocketInputHandler } from "@webiny/api-kernel-aws/abstractions/handlers/WebSocketInputHandler.js";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { InputTenantSource } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import { getEventValues } from "@webiny/api-websockets/handler/headers.js";
import { WebsocketsEventRequestContextEventType } from "@webiny/api-websockets/handler/types.js";
import type { IWebsocketsIncomingEvent } from "@webiny/api-websockets/handler/types.js";

/**
 * EXTRACT (transport-specific): an API Gateway WebSocket event runs in the tenant the client names
 * (`tenant` of the body or the query string, the root tenant without one). Registered in the root,
 * next to `WebSocketInputType`.
 *
 * An unknown tenant fails the event, except on `$disconnect`: a client still connected when its
 * tenant is deleted disconnects in the root tenant's scope, so its connection record is removed.
 */
class WebSocketTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== WebSocketInputHandler) {
            return undefined;
        }
        const event = request.input as IWebsocketsIncomingEvent;
        const { tenant } = getEventValues(event);
        const isDisconnect =
            event.requestContext?.eventType === WebsocketsEventRequestContextEventType.disconnect;
        return isDisconnect ? { tenantId: tenant, ifUnknown: "root" } : { tenantId: tenant };
    }
}

export const WebSocketTenantSource = InputTenantSource.createImplementation({
    implementation: WebSocketTenantSourceImpl,
    dependencies: []
});
