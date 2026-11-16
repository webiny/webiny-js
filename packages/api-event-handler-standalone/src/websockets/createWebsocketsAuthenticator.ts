import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import {
    registerApiRequestStack,
    type RegisterApiRequestStackConfig
} from "@webiny/api-event-handler-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { WebsocketsConnectionAuthenticator } from "@webiny/api-websockets-standalone";

/*
 * An `AuthenticationError` refuses the handshake rather than failing it. That includes more than bad
 * tokens: `AuthenticationError.from` wraps every error an authenticator throws, a failed key lookup
 * as well, so the reason is logged here, where it would otherwise be lost.
 */
const refuseOnAuthenticationError = (logger: Logger.Interface) => {
    return (error: unknown): null => {
        if (!(error instanceof AuthenticationError)) {
            throw error;
        }
        logger.warn({ code: error.code, error: error.message }, "[websockets] handshake refused");
        return null;
    };
};

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
        const authentication = child.resolve(AuthenticationContext);
        const refuse = refuseOnAuthenticationError(child.resolve(Logger));
        const identity = await authentication.authenticate(token).catch(refuse);
        // A token no authenticator recognises comes back as the anonymous identity, not as an error.
        if (!identity || identity.isAnonymous()) {
            return null;
        }
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    };
}
