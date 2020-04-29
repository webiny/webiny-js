import { merge } from "lodash";
import gql from "graphql-tag";
import { emptyResolver } from "@webiny/commodo-graphql";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import install from "./graphql/Install";

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-security",
    schema: {
        typeDefs: gql`
            extend type File @key(fields: "id") {
                id: ID @external
            }

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

            type SecurityCursors {
                next: String
                previous: String
            }

            type SecurityListMeta {
                cursors: SecurityCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            ${install.typeDefs}
            ${role.typeDefs}
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
            role.resolvers,
            group.resolvers,
            user.resolvers
        )
    }
};

export default plugin;
