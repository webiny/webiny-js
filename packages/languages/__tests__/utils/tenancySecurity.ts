import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import {
    AuthenticatedIdentity,
    type IdentityData
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface CreateTenancyAndSecurityParams {
    permissions?: SecurityPermission[];
}

export const createTenancyAndSecurity = (params: CreateTenancyAndSecurityParams = {}) => {
    const permissions = params.permissions ?? [{ name: "*" }];

    return [
        new ContextPlugin<ApiCoreContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                settings: {
                    domains: []
                },
                isInstalled: true,
                status: "enabled",
                description: "",
                parent: null,
                tags: [],
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                return new AuthenticatedIdentity({
                    id: "12345678",
                    type: "admin",
                    displayName: "John Doe"
                } as IdentityData);
            });

            context.security.addAuthorizer(async () => {
                return permissions;
            });
        }),
        new BeforeHandlerPlugin<ApiCoreContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
