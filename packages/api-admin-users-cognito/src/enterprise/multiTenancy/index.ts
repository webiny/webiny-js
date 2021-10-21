import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

export const createMultiTenancyPlugins = () => {
    return [
        new GraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                extend type AdminUserIdentity {
                    currentTenant: Tenant
                    defaultTenant: Tenant
                }
            `
        })
    ];
};
