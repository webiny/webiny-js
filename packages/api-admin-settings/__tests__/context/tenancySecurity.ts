import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type {
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-core/types/security.js";
import { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    return [
        createApiCore({
            tenancyStorageOperations: tenancyStorage.storageOperations,
            securityStorageOperations: securityStorage.storageOperations,
            usersStorageOperations: adminUsersStorage.storageOperations
        }),
        new ContextPlugin<ApiCoreContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                parent: null,
                description: "",
                isInstalled: true,
                status: "unknown",
                settings: {
                    domains: []
                },
                tags: [],
                webinyVersion: context.WEBINY_VERSION,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                return (
                    identity || {
                        id: "12345678",
                        type: "admin",
                        displayName: "John Doe"
                    }
                );
            });

            context.security.addAuthorizer(async () => {
                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<ApiCoreContext>(context => {
            return context.security.authenticate("");
        })
    ].filter(Boolean);
};
