import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "@webiny/kernel-aws";
import { httpResponseToApiGatewayResult } from "@webiny/kernel-aws";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import { extractAuthToken } from "@webiny/api-kernel-core";
import { rejectedTokenResponse } from "@webiny/api-kernel-core";

/**
 * EXTRACT (transport-specific): reads the auth token from an API Gateway event — see
 * {@link extractAuthToken} for the header precedence — into RawAuthToken, then invokes the shared LOAD
 * step (RequestIdentityLoader) which authenticates it and sets IdentityContext.
 *
 * A missing token leaves RawAuthToken null → the loader authenticates as anonymous. A token an identity
 * provider rejects ends the request with a 401, the same one standalone answers. Any other error
 * propagates.
 * Registered BEFORE ApiGatewayTenantLoaderDecorator so identity is established before tenant
 * (see ApiGatewayFeature).
 */
class ApiGatewayIdentityLoaderDecoratorImpl implements ApiGatewayInputHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: ApiGatewayInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.input?.headers as Record<string, string>;
        const authToken = extractAuthToken(headers);

        this.rawAuthToken.set(authToken);

        try {
            await this.identityLoader.establish();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                const response = rejectedTokenResponse(error, headers);
                return httpResponseToApiGatewayResult(response);
            }
            throw error;
        }
        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayIdentityLoaderDecorator = ApiGatewayInputHandler.createDecorator({
    decorator: ApiGatewayIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
