import { TestHttpEventHandler } from "@webiny/event-handler-core/features/testing";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

/**
 * Test-only decorator on the HTTP event handler: authenticates the `authorization` header and sets
 * the resulting identity before the request is dispatched (mirrors the prod identity loader).
 */
class AuthTriggerHandlerImpl implements TestHttpEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: TestHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers ?? {};
        const token = headers["authorization"] ?? "";
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return this.inner.execute(ctx, next);
    }
}

export const AuthTriggerHandler = TestHttpEventHandler.createDecorator({
    decorator: AuthTriggerHandlerImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
