import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { Context } from "@webiny/api/types";

export const applyMultiTenancyPlugins = (context: Context) => {
    context.plugins.register(
        new GraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                extend type AdminUserIdentity {
                    currentTenant: Tenant
                    defaultTenant: Tenant
                }
            `
        })
    );
};
