import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { ContextPlugin } from "@webiny/api";
import { TenantManagerContext } from "@webiny/api-tenant-manager/types";

export const extendTenancy = () => {
    return new ContextPlugin<TenantManagerContext>(context => {
        context.waitFor("tenantManager", () => {
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
                        }
                    }
                })
            );
        });
    });
};
