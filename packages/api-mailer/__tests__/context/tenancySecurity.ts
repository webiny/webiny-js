import { ContextPlugin } from "@webiny/api";

import { createPermissions } from "./helpers";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { SecurityPermission } from "@webiny/api-core/types/security";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreContext, ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    return [
        createApiCore({
            storageOperations: apiCoreStorage.storageOperations
        }),
        new ContextPlugin<ApiCoreContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                parent: null,
                description: "",
                status: "unknown",
                settings: {
                    domains: []
                },
                isInstalled: true,
                tags: [],
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                const base = identity || {
                    id: "12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
                return {
                    ...base,
                    permissions: createPermissions().concat({ name: "pb.*" })
                };
            });

            context.security.addAuthorizer(async () => {
                return permissions || [{ name: "*" }];
            });
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            await context.security.authenticate("");
        })
    ].filter(Boolean);
};
