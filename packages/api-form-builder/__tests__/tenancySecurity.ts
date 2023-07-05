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
import { createTenantLinkAuthorizer } from "@webiny/api-security/plugins/tenantLinkAuthorization";

interface Config {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config = {}) => {
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
                webinyVersion: process.env.WEBINY_VERSION,
                description: "",
                parent: null,
                settings: {
                    domains: []
                },
                status: "any",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                tags: []
            });

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            if (typeof permissions === "undefined") {
                context.security.addAuthorizer(async () => [{ name: "*" }]);
            } else {
                context.security.addAuthorizer(
                    createTenantLinkAuthorizer({
                        identityType: "test",
                        testTenantLink: {
                            data: { teams: [], groups: [{ id: "admin", permissions }] }
                        }
                    })(context)
                );
            }
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
