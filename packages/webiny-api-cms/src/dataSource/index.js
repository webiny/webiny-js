// @flow
import { dummyResolver } from "webiny-api/graphql";
import setupEntities from "../entities/setupEntities";

import page from "./schemas/Page";
import category from "./schemas/Category";
import menu from "./schemas/Menu";

export default {
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
        menu.typeDefs
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
        menu.resolvers
    ],
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
