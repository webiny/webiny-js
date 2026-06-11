import { EventHandler } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";

class AuthTriggerHandlerImpl implements EventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers ?? {};
        const token = headers["authorization"] ?? "";
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return next();
    }
}

export const AuthTriggerHandler = EventHandler.createImplementation({
    implementation: AuthTriggerHandlerImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
