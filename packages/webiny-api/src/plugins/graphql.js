// @flow
import { type GraphQLSchemaPluginType } from "webiny-api/types";
import { gql } from "apollo-server-lambda";
import { dummyResolver } from "../graphql";

export default ({
    type: "graphql-schema",
    name: "graphql-schema-api",
    schema: {
        namespace: "api",
        typeDefs: gql`
            type SettingsQuery {
                _empty: String
            }

            type SettingsMutation {
                _empty: String
            }

            type Query {
                settings: SettingsQuery
            }

            type Mutation {
                settings: SettingsMutation
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
