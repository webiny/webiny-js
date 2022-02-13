import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { Context } from "@webiny/handler/types";

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
