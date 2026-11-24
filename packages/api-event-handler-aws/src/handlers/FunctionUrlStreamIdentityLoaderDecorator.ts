import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import { LambdaResponseStream } from "@webiny/event-handler-aws";
import { writeHttpResponseToStream } from "@webiny/event-handler-aws";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { extractAuthToken } from "@webiny/api-event-handler-core";
import { rejectedTokenResponse } from "@webiny/api-event-handler-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): the Function URL streaming counterpart of
 * `ApiGatewayIdentityLoaderDecorator`. Same shared LOAD step; the only difference is that Function URL
 * events carry cookies as an array, so the headers are normalised first, and that the 401 for a rejected
 * token is written to the response stream instead of returned.
 *
 * Registered BEFORE FunctionUrlStreamTenantLoaderDecorator so identity is established before tenant.
 */
class FunctionUrlStreamIdentityLoaderDecoratorImpl
    implements FunctionUrlStreamEventHandler.Interface
{
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private responseStream: LambdaResponseStream.Interface,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const authToken = extractAuthToken(headers);

        this.rawAuthToken.set(authToken);

        try {
            await this.identityLoader.establish();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                const raw = this.responseStream.get();
                const response = rejectedTokenResponse(error, headers);
                await writeHttpResponseToStream(raw, response);
                return;
            }
            throw error;
        }
        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamIdentityLoaderDecorator =
    FunctionUrlStreamEventHandler.createDecorator({
        decorator: FunctionUrlStreamIdentityLoaderDecoratorImpl,
        dependencies: [RawAuthToken, RequestIdentityLoader, LambdaResponseStream]
    });
