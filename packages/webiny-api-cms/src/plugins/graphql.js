// @flow
import { getPlugins } from "webiny-plugins";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";

import page from "./graphql/Page";
import category from "./graphql/Category";
import menu from "./graphql/Menu";
import tag from "./graphql/Tag";

export default {
    type: "graphql",
    name: "graphql-cms",
    namespace: "cms",
    typeDefs: () => [
        `
            type CmsQuery {
                _empty: String
            }   
            
            type CmsMutation {
                _empty: String
            }
            
            type Query {
                cms: CmsQuery
            }
            
            type Mutation {
                cms: CmsMutation
            }
        `,
        page.typeDefs,
        category.typeDefs,
        menu.typeDefs,
        tag.typeDefs,
        ...getPlugins("cms-schema").map(pl => pl.typeDefs)
    ],
    resolvers: () => [
        {
            Query: {
                cms: dummyResolver
            },
            Mutation: {
                cms: dummyResolver
            }
        },
        page.resolvers,
        category.resolvers,
        menu.resolvers,
        tag.resolvers,
        ...getPlugins("cms-schema").map(pl => pl.resolvers)
    ],
    security: {
        shield: {
            CmsQuery: {
                getMenu: hasScope("cms:menu:crud"),
                listMenus: hasScope("cms:menu:crud"),
                getTag: hasScope("cms:tag:crud"),
                listTags: hasScope("cms:tag:crud"),
                getCategory: hasScope("cms:category:crud"),
                listCategories: hasScope("cms:category:crud"),
                listPages: hasScope("cms:page:crud"),
                listElements: hasScope("cms:element:crud"),
                oembedData: hasScope("cms:oembed:read")
            },
            CmsMutation: {
                createMenu: hasScope("cms:menu:crud"),
                updateMenu: hasScope("cms:menu:crud"),
                deleteMenu: hasScope("cms:menu:crud"),
                createTag: hasScope("cms:tag:crud"),
                updateTag: hasScope("cms:tag:crud"),
                deleteTag: hasScope("cms:tag:crud"),
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
            },
            SettingsQuery: {
                cms: hasScope("cms:settings")
            },
            SettingsMutation: {
                cms: hasScope("cms:settings")
            }
        }
    }
};
