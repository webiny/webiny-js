// @flow
import { gql } from "apollo-server-lambda";
import { merge } from "lodash";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import page from "./graphql/Page";
import category from "./graphql/Category";
import menu from "./graphql/Menu";
import settings from "./graphql/Settings";

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
        `,
        resolvers: merge(
            {
                Query: {
                    pageBuilder: dummyResolver
                },
                Mutation: {
                    pageBuilder: dummyResolver
                }
            },
            page.resolvers,
            category.resolvers,
            menu.resolvers,
            settings.resolvers
        )
    },
    security: {
        shield: {
           PbQuery: {
                getMenu: hasScope("cms:menu:crud"),
                listMenus: hasScope("cms:menu:crud"),
                getCategory: hasScope("cms:category:crud"),
                listCategories: hasScope("cms:category:crud"),
                listPages: hasScope("cms:page:crud"),
                listElements: hasScope("cms:element:crud"),
                oembedData: hasScope("cms:oembed:read"),
            },
           PbMutation: {
                createMenu: hasScope("cms:menu:crud"),
                updateMenu: hasScope("cms:menu:crud"),
                deleteMenu: hasScope("cms:menu:crud"),
                createCategory: hasScope("cms:category:crud"),
                updateCategory: hasScope("cms:category:crud"),
                deleteCategory: hasScope("cms:category:crud"),

                createPage: hasScope("cms:page:crud"),
                deletePage: hasScope("cms:page:crud"),

                createRevisionFrom: hasScope("cms:page:revision:create"),
                updateRevision: hasScope("cms:page:revision:update"),
                publishRevision: hasScope("cms:page:revision:publish"),
                deleteRevision: hasScope("cms:page:revision:delete"),

                createElement: hasScope("cms:element:crud"),
                updateElement: hasScope("cms:element:crud"),
                deleteElement: hasScope("cms:element:crud")
            }
        }
    }
};
