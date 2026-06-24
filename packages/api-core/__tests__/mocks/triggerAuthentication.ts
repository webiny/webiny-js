import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";

export const triggerAuthentication = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        const authCtx = context.container.resolve(AuthenticationContext);
        const identity = await authCtx.authenticate("");
        context.container.resolve(IdentityContext).setIdentity(identity);
    });
};
