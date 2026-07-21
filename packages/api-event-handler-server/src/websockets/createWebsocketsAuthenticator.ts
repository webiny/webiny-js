import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import {
    registerApiRequestStack,
    type RegisterApiRequestStackConfig
} from "@webiny/api-event-handler-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { WebsocketsConnectionAuthenticator } from "@webiny/api-websockets-server";

/**
 * Builds the `authenticate` callback the server WebSocket upgrade acceptor uses to turn a
 * connection's `?token` JWT into an identity.
 *
 * Each new WebSocket connection (the HTTP upgrade handshake) is authenticated from its `?token` JWT
 * so the connection is registered under the real identity — targeted server→client sends need this,
 * since SendToIdentity matches connections by identity id. The catch is that AuthenticationContext
 * lives in the per-request stack (registered by ApiCoreFeature, not registerRootStorage), so we can't
 * resolve it from the root container. Instead we spin up a short-lived request-scoped child container,
 * the same way createHandler does for each HTTP request, and resolve it there. We only need the core
 * stack, not the transports, because this is just the token→identity step the HTTP stack already runs
 * via RequestIdentityLoader — and that step doesn't depend on the tenant (the HTTP stack resolves
 * identity before tenant), so there's no request or tenant state to set up. Connections are rare (one
 * per admin session), so a fresh child per connection is cheap enough.
 *
 * This is also why the WebSocket server takes `authenticate` as a plain callback instead of resolving
 * auth itself: AuthenticationContext isn't reachable from the root container (it's per-request), so
 * only the handler — which can build a request-scoped child — can supply it. So authenticate has to be
 * a callback the handler builds, regardless of DI.
 */
export function createWebsocketsAuthenticator(
    rootContainer: Container,
    extensions: RegisterApiRequestStackConfig["extensions"]
): WebsocketsConnectionAuthenticator {
    return async token => {
        const child = rootContainer.createChildContainer();
        child.registerInstance(RequestContainer, child);
        await registerApiRequestStack(child, { extensions });
        const identity = await child.resolve(AuthenticationContext).authenticate(token);
        if (!identity?.id) {
            return null;
        }
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    };
}
