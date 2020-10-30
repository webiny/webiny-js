import gql from "graphql-tag";
import { merge } from "lodash";
import menus from "./graphql/menus";
import categories from "./graphql/categories";
import install from "./graphql/installation";
const emptyResolver = () => ({});

export default {
    type: "graphql-schema",
    schema: {
        typeDefs: gql`
            extend type File @key(fields: "id") {
                id: ID @external
            }

            input PbSearchInput {
                query: String
                fields: [String]
                operator: String
            }

            type PbError {
                code: String
                message: String
                data: JSON
            }

            type PbDeleteResponse {
                data: Boolean
                error: PbError
            }

            type PbBooleanResponse {
                data: Boolean
                error: PbError
            }

            type PbCursors {
                next: String
                previous: String
            }

            type PbListMeta {
                cursors: PbCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            type PbQuery {
                pageBuilder: PbQuery
            }

            type PbMutation {
                pageBuilder: PbMutation
            }

            extend type Query {
                pageBuilder: PbQuery
            }

            extend type Mutation {
                pageBuilder: PbMutation
            }

            ${menus.typeDefs},
            ${categories.typeDefs},
            ${install.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    pageBuilder: emptyResolver
                },
                Mutation: {
                    pageBuilder: emptyResolver
                }
            },
            categories.resolvers,
            menus.resolvers,
            // settings.resolvers,
            install.resolvers
        )
    }
};
