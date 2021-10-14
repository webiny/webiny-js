import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

export default () => {
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
