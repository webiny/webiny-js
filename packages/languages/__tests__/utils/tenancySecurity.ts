import { ContextPlugin } from "@webiny/api";

import {
    AuthenticatedIdentity,
    type IdentityData
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const createTenancyAndSecurity = () => {
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
                return [{ name: "*" }];
            });
        }),
        new ContextPlugin<ApiCoreContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
