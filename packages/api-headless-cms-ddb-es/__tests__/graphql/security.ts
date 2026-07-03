import { ContextPlugin } from "@webiny/api";
import { Tenant } from "@webiny/api-core/types/tenancy";
import type { CmsContext } from "~/types";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { Authenticator } from "@webiny/api-core/features/security/authentication/Authenticator/index.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

export const createSecurity = () => {
    return [
        new ContextPlugin<CmsContext>(context => {
            context.container.resolve(TenantContext).setTenant({
                id: "root",
                name: "Root"
            } as Tenant);

            context.container.registerFactory(Authenticator, () => ({
                authenticate: async () => ({
                    id: "id-12345678",
                    type: "admin",
                    displayName: "John Doe"
                })
            }));

            context.container.registerFactory(Authorizer, () => ({
                authorize: async () => [{ name: "*" }]
            }));
        }),
        new ContextPlugin<CmsContext>(async context => {
            const authCtx = context.container.resolve(AuthenticationContext);
            const identity = await authCtx.authenticate("");
            context.container.resolve(IdentityContext).setIdentity(identity);
        })
    ];
};
