import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityContext,
    SecurityIdentity,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations } from "@webiny/api-tenancy/types";
import { AdminUsersContext } from "~/types";
import { createGroupAuthorizer } from "@webiny/api-security/plugins/groupAuthorization";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTenantLinksPermissionsAuthorizer } from "@webiny/api-security/plugins/groupAuthorization";

interface Config {
    fullAccess?: boolean;
    identity?: SecurityIdentity;
}

export const createTenancyAndSecurity = ({ fullAccess, identity }: Config = {}) => {
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
                status: "unknown",
                parent: null,
                tags: [],
                settings: {
                    domains: []
                },
                description: "",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                webinyVersion: process.env.WEBINY_VERSION as string
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

            const groupAuthorizer = createTenantLinksPermissionsAuthorizer({
                identityType: "admin"
            })(context);
            context.security.addAuthorizer(async () => {
                if (fullAccess) {
                    return [{ name: "*" }];
                }

                return groupAuthorizer();
            });
        }),
        new BeforeHandlerPlugin<SecurityContext & AdminUsersContext>(context => {
            // We need to set an exact user ID to match the Identity ID
            context.adminUsers.onUserBeforeCreate.subscribe(({ user }) => {
                if (user.email === "admin@webiny.com") {
                    user.id = "12345678";
                }
            });

            return context.security.authenticate("");
        })
    ];
};
