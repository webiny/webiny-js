import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

export default new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        interface SecurityIdentity {
            id: ID!
            type: String!
            displayName: String!
            permissions: [JSON!]!
        }
    `
});
