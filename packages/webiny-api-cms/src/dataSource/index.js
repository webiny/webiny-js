import { genericTypes, dummyResolver } from "webiny-api/graphql";

import page from "./Page";
import category from "./Category";
import revision from "./Revision";

export default {
    namespace: "cms",
    typeDefs: `
        ${genericTypes()}
        
        ${revision.typeDefs}
        ${page.typeDefs}
        ${category.typeDefs}
        
        type CmsQuery {
            ${page.queryFields}
            ${revision.queryFields}
            ${category.queryFields}
        }
        
        type CmsMutation {
            ${page.mutationFields}
            ${revision.mutationFields}
            ${category.mutationFields}
        }
        
        type Query {
            cms: CmsQuery
        }
        
        type Mutation {
            cms: CmsMutation
        }
    `,
    resolvers: {
        Query: {
            cms: dummyResolver
        },
        Mutation: {
            cms: dummyResolver
        },
        CmsQuery: {
            ...page.queryResolvers,
            ...revision.queryResolvers,
            ...category.queryResolvers
        },
        CmsMutation: {
            ...page.mutationResolvers,
            ...revision.mutationResolvers,
            ...category.mutationResolvers
        }
    }
};
