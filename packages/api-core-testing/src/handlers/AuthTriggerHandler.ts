import { TestHttpInputHandler } from "@webiny/api-kernel-core/features/testing";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

/**
 * Test-only decorator on the HTTP event handler: authenticates the `authorization` header and sets
 * the resulting identity before the request is dispatched (mirrors the prod identity loader).
 */
class AuthTriggerHandlerImpl implements TestHttpInputHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: TestHttpInputHandler.Interface
    ) {}

    async execute(ctx: InputContext, next: NextFunction): Promise<any> {
        const headers = ctx.input?.headers ?? {};
        const token = headers["authorization"] ?? "";
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return this.inner.execute(ctx, next);
    }
}

export const AuthTriggerHandler = TestHttpInputHandler.createDecorator({
    decorator: AuthTriggerHandlerImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
