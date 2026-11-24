import { HttpRouter } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { extractAuthToken } from "~/auth/extractAuthToken.js";
import { rejectedTokenResponse } from "~/auth/rejectedTokenResponse.js";

/**
 * Reads the auth token from the request (see {@link extractAuthToken} for the header precedence) into
 * RawAuthToken, then runs the shared load step, RequestIdentityLoader, which authenticates it and sets
 * IdentityContext. A missing token authenticates as anonymous.
 *
 * A token an identity provider rejects ends the request with a 401. Any other error propagates, and
 * `HttpErrorDecorator` answers it with a 500.
 */
class HttpIdentityLoaderDecoratorImpl implements HttpRouter.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: RequestIdentityLoader.Interface,
        private decoratee: HttpRouter.Interface
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        const authToken = extractAuthToken(request.headers);
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

export const HttpIdentityLoaderDecorator = HttpRouter.createDecorator({
    decorator: HttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
