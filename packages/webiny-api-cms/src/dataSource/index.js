// @flow
import { addPlugin, getPlugins } from "webiny-api/plugins";
import { dummyResolver } from "webiny-api/graphql";
import setupEntities from "../entities/setupEntities";
import plugins from "../plugins";

import page from "./schemas/Page";
import category from "./schemas/Category";

export default () => {
    // Register plugins
    addPlugin(...plugins);

    // Create dataSource
    return {
        namespace: "cms",
        typeDefs: [
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
            ...getPlugins("cms-schema").map(pl => pl.typeDefs)
        ],
        resolvers: [
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
            ...getPlugins("cms-schema").map(pl => pl.resolvers)
        ],
        context: (ctx: Object) => {
            return setupEntities(ctx);
        }
    };
};
