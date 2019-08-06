// @flow
import { gql } from "apollo-server-lambda";
import { merge } from "lodash";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import page from "./graphql/Page";
import category from "./graphql/Category";
import menu from "./graphql/Menu";

export default {
    type: "graphql-schema",
    name: "graphql-schema-cms",
    schema: {
        typeDefs: gql`
            extend type File @key(fields: "id") {
                id: ID! @external
            }

            input PageBuilderSearchInput {
                query: String
                fields: [String]
                operator: String
            }

            type PageBuilderListMeta {
                totalCount: Int
                totalPages: Int
                page: Int
                perPage: Int
                from: Int
                to: Int
                previousPage: Int
                nextPage: Int
            }

            type PageBuilderError {
                code: String
                message: String
                data: JSON
            }

            type PageBuilderDeleteResponse {
                data: Boolean
                error: PageBuilderError
            }

            type PageBuilderQuery {
                _empty: String
            }

            type PageBuilderMutation {
                _empty: String
            }

            type CmsQuery {
                pageBuilder: PageBuilderQuery
            }

            type CmsMutation {
                pageBuilder: PageBuilderMutation
            }

            extend type Query {
                cms: CmsQuery
            }

            extend type Mutation {
                cms: CmsMutation
            }

            ${page.typeDefs}
            ${category.typeDefs}
            ${menu.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    cms: dummyResolver
                },
                Mutation: {
                    cms: dummyResolver
                },
                CmsQuery: {
                    pageBuilder: dummyResolver
                },
                CmsMutation: {
                    pageBuilder: dummyResolver
                }
            },
            page.resolvers,
            category.resolvers,
            menu.resolvers
        )
    },
    security: {
        shield: {
            CmsQuery: {
                pageBuilder: dummyResolver
            },
            CmsMutation: {
                pageBuilder: dummyResolver
            },
            PageBuilderQuery: {
                getMenu: hasScope("cms:menu:crud"),
                listMenus: hasScope("cms:menu:crud"),
                getCategory: hasScope("cms:category:crud"),
                listCategories: hasScope("cms:category:crud"),
                listPages: hasScope("cms:page:crud"),
                listElements: hasScope("cms:element:crud"),
                oembedData: hasScope("cms:oembed:read")
            },
            PageBuilderMutation: {
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
