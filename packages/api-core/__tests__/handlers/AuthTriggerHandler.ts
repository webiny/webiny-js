import { TestHttpInputHandler } from "@webiny/api-kernel-core/features/testing";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";

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
