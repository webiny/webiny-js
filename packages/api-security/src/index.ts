import {PluginCollection} from "@webiny/plugins/types";
import {ContextPlugin} from "@webiny/handler/plugins/ContextPlugin";
import {TenancyContext} from "@webiny/api-tenancy/types";
import {
    SecurityAuthenticationPlugin,
    SecurityAuthorizationPlugin,
    SecurityContext,
    SecurityStorageOperations
} from "./types";
import graphqlPlugins from "./graphql";
import {createSecurity} from "~/createSecurity";
import {attachGroupInstaller} from "~/installation/groups";
import multiTenancy from "./multiTenancy";
import NotAuthorizedError from "~/NotAuthorizedError";

export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse";
export { default as NotAuthorizedError } from "./NotAuthorizedError";

export interface SecurityConfig {
    storageOperations: SecurityStorageOperations;
}

type Context = SecurityContext & TenancyContext;

export default ({ storageOperations }: SecurityConfig): PluginCollection => [
    new ContextPlugin<Context>(async context => {
        context.security = await createSecurity({
            getTenant: () => {
                const tenant = context.tenancy.getCurrentTenant();
                return tenant ? tenant.id : undefined;
            },
            storageOperations
        });

        attachGroupInstaller(context.security);

        // Register plugins for multi-tenant environment
        if (context.tenancy.isMultiTenant()) {
            context.plugins.register(multiTenancy());
        }

        // Backwards Compatibility - START
        context.plugins
            .byType<SecurityAuthenticationPlugin>("security-authentication")
            .forEach(pl => {
                context.security.addAuthenticator(() => {
                    return pl.authenticate(context);
                });
            });

        context.plugins
            .byType<SecurityAuthorizationPlugin>("security-authorization")
            .forEach(pl => {
                context.security.addAuthorizer(() => {
                    return pl.getPermissions(context);
                });
            });

        // Backwards Compatibility - END
    }),
    new ContextPlugin<Context>(context => {
        if (!context.tenancy.isMultiTenant()) {
            return;
        }

        context.security.onAfterLogin.subscribe(async ({ identity }) => {
            // Check if current identity is allowed to access the given tenant!
            const tenant = context.tenancy.getCurrentTenant();
            const link = await context.security.getTenantLinkByIdentity({
                identity: identity.id,
                tenant: tenant.id
            });

            if (link) {
                return;
            }

            if (tenant.parent) {
                // Check if this identity belongs to a tenant that is the parent of the current tenant.
                const parentLink = await context.security.getTenantLinkByIdentity({
                    identity: identity.id,
                    tenant: tenant.parent
                });
                
                if (parentLink) {
                    return;
                }
            }

            throw new NotAuthorizedError({
                message: `You're not authorized to access this tenant!`,
                code: "NOT_AUTHORIZED"
            });
        });
    }),
    graphqlPlugins
];
