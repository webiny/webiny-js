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
    identity?: SecurityIdentity;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe",
    email: "testing@webiny.com"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config = {}) => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    return [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        createTenancyGraphQL(),
        createSecurityContext({
            storageOperations: securityStorage.storageOperations
        }),
        createSecurityGraphQL(),
        new ContextPlugin<SecurityContext & TenancyContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                parent: null,
                status: "unknown",
                description: "",
                tags: [],
                settings: {
                    domains: []
                },
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
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
