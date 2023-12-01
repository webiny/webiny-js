import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        extend input AdminUsersInstallInput {
            firstName: String!
            lastName: String!
            email: String!
            password: String!
        }
    `
});
