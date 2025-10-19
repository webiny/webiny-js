import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";

export default new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type Tenant {
            id: ID!
            name: String!
            image: JSON
            description: String!
            parent: ID
            tags: [String!]!
            settings: JSON
        }
    `
});
