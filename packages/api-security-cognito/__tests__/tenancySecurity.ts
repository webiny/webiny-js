import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import type {
    SecurityContext,
    SecurityIdentity,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { TenancyContext, TenancyStorageOperations } from "@webiny/api-tenancy/types";
import type { AdminUsersContext } from "@webiny/api-admin-users/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTenantLinkAuthorizer } from "@webiny/api-security/plugins/tenantLinkAuthorization";
import { UserBeforeCreateHandler } from "@webiny/api-admin-users/features/CreateUser/index.js";

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
                isInstalled: true,
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

            const tenantLinkAuthorizer = createTenantLinkAuthorizer({
                identityType: "admin"
            })(context);

            context.security.addAuthorizer(async () => {
                if (fullAccess) {
                    return [{ name: "*" }];
                }

                return tenantLinkAuthorizer();
            });
        }),
        new BeforeHandlerPlugin<SecurityContext & AdminUsersContext>(context => {
            context.container.registerFactory(UserBeforeCreateHandler, () => {
                return {
                    handle(event) {
                        const { user } = event.payload;

                        if (user.email === "admin@webiny.com") {
                            user.id = "12345678";
                        }
                    }
                };
            });

            return context.security.authenticate("");
        })
    ];
};
