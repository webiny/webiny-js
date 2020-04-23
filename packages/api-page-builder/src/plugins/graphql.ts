import gql from "graphql-tag";
import { merge } from "lodash";
import { emptyResolver } from "@webiny/graphql";
import page from "./graphql/Page";
import category from "./graphql/Category";
import menu from "./graphql/Menu";
import settings from "./graphql/Settings";
import install from "./graphql/install";

export default {
    type: "graphql-schema",
    name: "graphql-schema-page-builder",
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

            type PbListMeta {
                totalCount: Int
                totalPages: Int
                page: Int
                perPage: Int
                from: Int
                to: Int
                previousPage: Int
                nextPage: Int
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

            ${page.typeDefs}
            ${category.typeDefs}
            ${menu.typeDefs}
            ${settings.typeDefs}
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
            page.resolvers,
            category.resolvers,
            menu.resolvers,
            settings.resolvers,
            install.resolvers
        )
    }
};
