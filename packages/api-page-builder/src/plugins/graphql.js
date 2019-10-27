// @flow
import { gql } from "apollo-server-lambda";
import { merge } from "lodash";
import { emptyResolver } from "@webiny/api";
import { hasScope } from "@webiny/api-security";
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
    },
    security: {
        shield: {
            PbQuery: {
                getMenu: hasScope("pb:menu:crud"),
                listMenus: hasScope("pb:menu:crud"),
                getCategory: hasScope("pb:category:crud"),
                listCategories: hasScope("pb:category:crud"),
                listPages: hasScope("pb:page:crud"),
                listElements: hasScope("pb:element:crud"),
                oembedData: hasScope("pb:oembed:read")
            },
            PbMutation: {
                createMenu: hasScope("pb:menu:crud"),
                updateMenu: hasScope("pb:menu:crud"),
                deleteMenu: hasScope("pb:menu:crud"),
                createCategory: hasScope("pb:category:crud"),
                updateCategory: hasScope("pb:category:crud"),
                deleteCategory: hasScope("pb:category:crud"),

                createPage: hasScope("pb:page:crud"),
                deletePage: hasScope("pb:page:crud"),

                createRevisionFrom: hasScope("pb:page:revision:create"),
                updateRevision: hasScope("pb:page:revision:update"),
                publishRevision: hasScope("pb:page:revision:publish"),
                deleteRevision: hasScope("pb:page:revision:delete"),

                createElement: hasScope("pb:element:crud"),
                updateElement: hasScope("pb:element:crud"),
                deleteElement: hasScope("pb:element:crud")
            }
        }
    }
};
