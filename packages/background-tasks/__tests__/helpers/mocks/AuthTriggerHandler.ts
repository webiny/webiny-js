import { TestHttpEventHandler } from "@webiny/event-handler-core/features/testing";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class AuthTriggerHandlerImpl implements TestHttpEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: TestHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const authHeader: string = ctx.event?.headers?.authorization ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
        const identity = await this.authCtx.authenticate(token);
        if (identity) {
            this.identityCtx.setIdentity(identity);
        }
        return this.inner.execute(ctx, next);
    }
}

export const AuthTriggerHandler = TestHttpEventHandler.createDecorator({
    decorator: AuthTriggerHandlerImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
