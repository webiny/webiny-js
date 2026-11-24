import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-core/nodeHttp/index.js";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { corsHeaders } from "@webiny/event-handler-core";
import { codedErrorBody } from "@webiny/event-handler-core";
import type { EventContext, IHttpResponse, NextFunction } from "@webiny/event-handler-core";
import { extractAuthToken } from "~/auth/extractAuthToken.js";
import { headersFromIncomingMessage } from "./headersFromIncomingMessage.js";

/*
 * The answer to a request whose token was rejected, for example by `verifyTokenClaims`. This runs
 * before the router, so `SecureHeadersDecorator` never sees the response and the CORS headers are
 * added here.
 */
function authenticationErrorResponse(
    request: IncomingMessage,
    error: AuthenticationError
): IHttpResponse {
    const cors = corsHeaders(request.headers.origin);
    const body = codedErrorBody(error);

    return {
        statusCode: 401,
        headers: {
            ...cors,
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"'
        },
        body
    };
}

/**
 * EXTRACT (transport-specific): reads the auth token from a Node `IncomingMessage` —
 * `x-webiny-authorization` first, then the bearer `Authorization` header, then the `wby-id-token`
 * cookie — into RawAuthToken, then invokes the shared LOAD step (RequestIdentityLoader) which
 * authenticates it (via the registered identity provider, e.g. the self-hosted JWT IdP) and sets
 * IdentityContext.
 *
 * `x-webiny-authorization` exists for AWS parity: behind CloudFront with Origin Access Control, SigV4
 * occupies the `Authorization` header, so clients that may traverse such an origin send the token in
 * that header instead. Standalone has no such constraint, but it accepts the same header so one
 * client works against both deployments.
 *
 * A token an identity provider rejects ends the request with a 401. Any other error propagates.
 *
 * Node counterpart of ApiGatewayIdentityLoaderDecorator, which does not answer 401 yet: on AWS a
 * rejected token still fails the invocation. Registered before the tenant loader, which makes
 * it the inner wrapper: the tenant is loaded first, because API-key authentication looks the key up
 * in the tenant's partition.
 */
class NodeHttpIdentityLoaderDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = headersFromIncomingMessage(ctx.event);
        const authToken = extractAuthToken(headers);
        this.rawAuthToken.set(authToken);
        try {
            await this.identityLoader.establish();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return authenticationErrorResponse(ctx.event, error);
            }
            throw error;
        }
        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpIdentityLoaderDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
