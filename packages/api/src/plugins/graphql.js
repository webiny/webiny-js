// @flow
import { type GraphQLSchemaPluginType } from "@webiny/api/types";
import { gql } from "apollo-server-lambda";
import { dummyResolver } from "../graphql/commodo";

export default ({
    type: "graphql-schema",
    name: "graphql-schema-api",
    schema: {
        namespace: "api",
        typeDefs: gql`
            type Query {
                _empty: String
            }

            type Mutation {
                _empty: String
            }
        `,
        resolvers: {
            Query: {
                settings: dummyResolver
            },
            Mutation: {
                settings: dummyResolver
            }
        }
    }
}: GraphQLSchemaPluginType);
