import { HttpRouteDispatcher } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { extractAuthToken } from "~/auth/extractAuthToken.js";
import { rejectedTokenResponse } from "~/auth/rejectedTokenResponse.js";

/**
 * Runs in the request's tenant scope, as a decorator of `HttpRouteDispatcher`: API-key
 * authentication looks the key up in the tenant, and the identity's permissions are the tenant's.
 *
 * Reads the auth token from the request into RawAuthToken (see {@link extractAuthToken} for the
 * header precedence and when the `wby-id-token` cookie counts), then runs the shared load step,
 * RequestIdentityLoader, which authenticates it and sets IdentityContext. A missing token
 * authenticates as anonymous.
 *
 * A token an identity provider rejects ends the request with a 401. Any other error propagates, and
 * `ErrorResponseDecorator` answers it with a 500.
 */
class HttpIdentityLoaderDecoratorImpl implements HttpRouteDispatcher.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: RequestIdentityLoader.Interface,
        private decoratee: HttpRouteDispatcher.Interface
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        /*
         * The method and path decide whether the `wby-id-token` cookie may be used (private file
         * reads only). Every transport hands the router the path with any API Gateway stage prefix
         * already stripped, so this is the path the route matched on.
         */
        const authToken = extractAuthToken(request);
        this.rawAuthToken.set(authToken);
        try {
            await this.identityLoader.establish();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return rejectedTokenResponse(error);
            }
            throw error;
        }
        return this.decoratee.route(request);
    }
}

export const HttpIdentityLoaderDecorator = HttpRouteDispatcher.createDecorator({
    decorator: HttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
