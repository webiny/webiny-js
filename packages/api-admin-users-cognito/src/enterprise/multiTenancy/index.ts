import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

export const applyMultiTenancyPlugins = context => {
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
