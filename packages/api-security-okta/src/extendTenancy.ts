import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "@webiny/api-tenancy/types";

export const extendTenancy = () => {
    return new GraphQLSchemaPlugin<TenancyContext>({
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
    });
};
