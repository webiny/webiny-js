// @flow
import { getPlugins } from "webiny-plugins";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-security/api";

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
                getMenu: hasScope("cms:menu:get"),
                listMenus: hasScope("cms:menu:list"),
                getTag: hasScope("cms:tag:get"),
                listTags: hasScope("cms:tag:list"),
                getCategory: hasScope("cms:category:get"),
                listCategories: hasScope("cms:category:list"),
                listPages: hasScope("cms:page:list"),
                listElements: hasScope("cms:element:list"),
                oembedData: hasScope("cms:oembed:get")
            },
            CmsMutation: {
                createMenu: hasScope("cms:menu:create"),
                updateMenu: hasScope("cms:menu:update"),
                deleteMenu: hasScope("cms:menu:delete"),
                createTag: hasScope("cms:tag:create"),
                updateTag: hasScope("cms:tag:update"),
                deleteTag: hasScope("cms:tag:delete"),
                createCategory: hasScope("cms:category:create"),
                updateCategory: hasScope("cms:category:update"),
                deleteCategory: hasScope("cms:category:delete"),
                // Pages:
                createPage: hasScope("cms:page:create"),
                deletePage: hasScope("cms:page:delete"),
                createRevisionFrom: hasScope("cms:page:revision:create"),
                updateRevision: hasScope("cms:page:revision:update"),
                publishRevision: hasScope("cms:page:revision:update"),
                deleteRevision: hasScope("cms:page:revision:delete"),
                createElement: hasScope("cms:element:create"),
                updateElement: hasScope("cms:element:update"),
                deleteElement: hasScope("cms:element:delete")
            }
        }
    }
};
