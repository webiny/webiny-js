import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { ContextPlugin } from "@webiny/handler";
import { TenantManagerContext } from "@webiny/api-tenant-manager/types";

export const extendTenancy = () => {
    return new ContextPlugin<TenantManagerContext>(context => {
        // This is only applicable to multi-tenant environments.
        context.waitFor("tenantManager", () => {
            // We can have different "appClientId" for each tenant.
            // This plugin adds the GraphQL fields to allow per-tenant appClientId storage.
            context.plugins.register(
                new GraphQLSchemaPlugin<TenancyContext>({
                    typeDefs: /* GraphQL */ `
                        extend input TenantSettingsInput {
                            appClientId: String!
                        }

                        extend type TenantSettings {
                            appClientId: String!
                        }
                        extend type TenancyQuery {
                            appClientId: String
                        }
                    `,
                    resolvers: {
                        TenancyQuery: {
                            appClientId(_, __, context) {
                                const tenant = context.tenancy.getCurrentTenant();
                                return tenant.settings.appClientId;
                            }
                        },
                        TenantSettings: {
                            /**
                             * Root tenant will not have the `appClientId` stored in the database,
                             * and in TenantSettings type, this field is non-nullable, so we need a fallback value.
                             */
                            appClientId: tenant => {
                                return tenant.appClientId || "";
                            }
                        }
                    }
                })
            );
        });
    });
};
