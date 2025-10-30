import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createTenantLinkAuthorizer } from "@webiny/api-core/legacy/security/plugins/tenantLinkAuthorization.js";
import { UserBeforeCreateHandler } from "@webiny/api-core/features/CreateUser";

interface Config {
    fullAccess?: boolean;
    identity?: IdentityData;
}

export const createTenancyAndSecurity = ({ fullAccess, identity }: Config = {}) => {
    return [
        new ContextPlugin<ApiCoreContext>(context => {
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
        new BeforeHandlerPlugin<ApiCoreContext>(context => {
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
