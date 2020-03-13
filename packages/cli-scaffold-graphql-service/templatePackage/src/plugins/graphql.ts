import gql from "graphql-tag";
import graphqlSchema from "./graphql";
import { GraphQLSchemaPlugin } from "@webiny/api/types";

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-thingy",
    schema: {
        typeDefs: gql`
            ${graphqlSchema.typeDefs}
        `,
        resolvers: {
            ...graphqlSchema.resolvers
        }
    },
    security: {
        shield: {
            // ...
        }
    }
};

export default plugin;
