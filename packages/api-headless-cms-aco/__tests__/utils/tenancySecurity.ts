import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityContext,
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations } from "@webiny/api-tenancy/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";

interface Config {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    return [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        createTenancyGraphQL(),
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
        createSecurityGraphQL(),
        new ContextPlugin<SecurityContext & TenancyContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                settings: {
                    domains: []
                },
                status: "unknown",
                description: "",
                parent: null,
                tags: [],
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                webinyVersion: "w.w.w"
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
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
