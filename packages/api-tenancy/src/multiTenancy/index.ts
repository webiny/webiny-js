import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

export default () => {
    return new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type TenantResponse {
                data: Tenant
                error: TenancyError
            }

            extend type TenancyQuery {

            }
        `,
        resolvers: {
            TenancyQuery: {}
        }
    });
};
