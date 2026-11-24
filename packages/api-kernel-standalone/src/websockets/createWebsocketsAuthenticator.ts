import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/kernel-core";
import {
    registerApiRequestStack,
    type RegisterApiRequestStackConfig
} from "@webiny/api-kernel-core";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TenantNotFoundError } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CanAccessCurrentTenantUseCase } from "@webiny/api-core/features/security/CanAccessCurrentTenant/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { WebsocketsConnectionAuthenticator } from "@webiny/api-websockets-standalone";

/*
 * An `AuthenticationError` refuses the handshake rather than failing it. That includes more than bad
 * tokens: `AuthenticationError.from` wraps every error an authenticator throws, a failed key lookup
 * as well, so the reason is logged here, where it would otherwise be lost.
 */
const refuseOnAuthenticationError = (logger: Logger.Interface) => {
    return (error: unknown): false => {
        if (!(error instanceof AuthenticationError)) {
            throw error;
        }
        logger.warn({ code: error.code, error: error.message }, "[websockets] handshake refused");
        return false;
    };
};

/**
 * Builds the `authenticate` callback the server WebSocket upgrade acceptor uses to turn a
 * connection's `?token` JWT into an identity in the connection's `?tenant`.
 *
 * Each new WebSocket connection (the HTTP upgrade handshake) is authenticated from its `?token` JWT
 * so the connection is registered under the real identity — targeted server→client sends need this,
 * since SendToIdentity matches connections by identity id. The catch is that AuthenticationContext
 * lives in the per-request stack (registered by ApiCoreFeature, not registerRootStorage), so we can't
 * resolve it from the root container. Instead we spin up a short-lived request-scoped child container,
 * the same way createHandler does for each HTTP request, and resolve it there. We only need the core
 * stack, not the transports. Like an HTTP transport, it only extracts the raw tenant id and token and
 * leaves the rest to the shared request loaders, tenant first, because an API key is looked up in the
 * current tenant. The identity must then be able to access that tenant: the client names the tenant,
 * so a valid token alone would let a user of one tenant receive another tenant's messages.
 * Connections are rare (one per admin session), so a fresh child per connection is cheap enough.
 *
 * This is also why the WebSocket server takes `authenticate` as a plain callback instead of resolving
 * auth itself: AuthenticationContext isn't reachable from the root container (it's per-request), so
 * only the handler — which can build a request-scoped child — can supply it. So authenticate has to be
 * a callback the handler builds, regardless of DI.
 */
const refuseUnknownTenant = (error: unknown): false => {
    if (error instanceof TenantNotFoundError) {
        return false;
    }
    throw error;
};

export function createWebsocketsAuthenticator(
    rootContainer: Container,
    extensions: RegisterApiRequestStackConfig["extensions"]
): WebsocketsConnectionAuthenticator {
    return async (token, tenantId) => {
        const child = rootContainer.createChildContainer();
        child.registerInstance(RequestContainer, child);
        await registerApiRequestStack(child, { extensions });

        child.resolve(RawTenantId).set(tenantId);
        child.resolve(RawAuthToken).set(token);

        const tenantLoaded = await child
            .resolve(RequestTenantLoader)
            .establish()
            .then(() => true)
            .catch(refuseUnknownTenant);
        // An unknown tenant refuses the handshake rather than failing it.
        if (!tenantLoaded || !child.resolve(TenantContext).getTenant()) {
            return null;
        }

        const refuse = refuseOnAuthenticationError(child.resolve(Logger));
        const authenticated = await child
            .resolve(RequestIdentityLoader)
            .establish()
            .then(() => true)
            .catch(refuse);
        if (!authenticated) {
            return null;
        }

        // False for the anonymous identity, which is what a token no authenticator recognises gives.
        const canAccessTenant = await child.resolve(CanAccessCurrentTenantUseCase).execute();
        if (!canAccessTenant) {
            return null;
        }

        const identity = child.resolve(IdentityContext).getIdentity();
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    };
}
