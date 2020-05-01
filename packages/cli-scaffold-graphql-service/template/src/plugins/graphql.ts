import gql from "graphql-tag";
import graphqlSchema from "./graphql/index";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-thingy",
    schema: {
        typeDefs: gql`
            ${graphqlSchema.typeDefs}

            # ... Your custom types
        `,
        resolvers: {
            ...graphqlSchema.resolvers

            /* ...Your custom resolvers */
        }
    }
};

export default plugin;
