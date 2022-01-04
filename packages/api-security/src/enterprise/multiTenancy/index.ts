import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { Response } from "@webiny/handler-graphql";
import { getDefaultTenant as baseGetDefaultTenant } from "./getDefaultTenant";
import { SecurityContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { NotAuthorizedError } from "~/index";
export { getDefaultTenant } from "./getDefaultTenant";

type Context = SecurityContext & TenancyContext;

export interface MultiTenancyAppConfig {
    /**
     * NOTE: This parameter is only relevant in multi-tenant environments.
     */
    verifyIdentityToTenantLink?: boolean;
}

export interface MultiTenancyGraphQLConfig {
    /**
     * NOTE: This parameter is only relevant in multi-tenant environments.
     */
    getDefaultTenant?(context: Context): Promise<Tenant>;
}

export const applyMultiTenancyPlugins = (config: MultiTenancyAppConfig, context: Context) => {
    if (config.verifyIdentityToTenantLink !== false) {
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
    }
};

export const applyMultiTenancyGraphQLPlugins = (
    config: MultiTenancyGraphQLConfig,
    context: Context
) => {
    const getDefaultTenant = config.getDefaultTenant || baseGetDefaultTenant;

    context.plugins.register(
        new GraphQLSchemaPlugin<Context>({
            typeDefs: /* GraphQL */ `
                extend interface SecurityIdentity {
                    currentTenant: Tenant
                    defaultTenant: Tenant
                }

                extend type TenancyQuery {
                    getDefaultTenant: TenantResponse
                }
            `,
            resolvers: {
                TenancyQuery: {
                    async getDefaultTenant(_, __, context) {
                        return new Response(await getDefaultTenant(context));
                    }
                },
                SecurityIdentity: {
                    defaultTenant(_, __, context) {
                        return getDefaultTenant(context);
                    },
                    currentTenant(_, __, context) {
                        return context.tenancy.getCurrentTenant();
                    }
                }
            }
        })
    );
};
