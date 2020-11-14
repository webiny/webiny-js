import merge from "lodash.merge";
import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

import install from "./graphql/install";
import group from "./graphql/group";
import user from "./graphql/user";

const emptyResolver = () => ({});

export default (): GraphQLSchemaPlugin => ({
    type: "graphql-schema",
    name: "graphql-schema-security",
    schema: {
        typeDefs: gql`
            type SecurityQuery {
                _empty: String
            }

            type SecurityMutation {
                _empty: String
            }

            extend type Query {
                security: SecurityQuery
            }

            extend type Mutation {
                security: SecurityMutation
            }

            type SecurityError {
                code: String
                message: String
                data: JSON
            }

            type SecurityBooleanResponse {
                data: Boolean
                error: SecurityError
            }

            ${install.typeDefs}
            ${group.typeDefs}
            ${user.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    security: emptyResolver
                },
                Mutation: {
                    security: emptyResolver
                }
            },
            install.resolvers,
            group.resolvers,
            user.resolvers
        )
    }
});
