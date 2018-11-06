import { dummyResolver } from "webiny-api/graphql";
import setupEntities from "../entities/setupEntities";

import page from "./schemas/Page";
import category from "./schemas/Category";

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
        category.typeDefs
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
        category.resolvers
    ],
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
