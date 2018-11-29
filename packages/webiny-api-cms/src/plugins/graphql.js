// @flow
import { getPlugins } from "webiny-plugins";
import { dummyResolver } from "webiny-api/graphql";

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
    ]
};
