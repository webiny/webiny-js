import { HttpEventHandler } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";

class AuthTriggerHandlerImpl implements HttpEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers ?? {};
        if (!headers["authorization"]) {
            const identity = await this.authCtx.authenticate("");
            this.identityCtx.setIdentity(identity);
        }
        return next();
    }
}

export const AuthTriggerHandler = HttpEventHandler.createImplementation({
    implementation: AuthTriggerHandlerImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
