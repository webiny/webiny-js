import { dummyResolver } from "webiny-api/graphql";
import setupEntities from "./setupEntities";
import resolveUser from "./schemas/typeResolvers/resolveUser";

import page from "./schemas/Page.schema";
import category from "./schemas/Category.schema";

export default {
    namespace: "cms",
    typeDefs: `
        type Author {
            id: ID
            firstName: String
            lastName: String
            email: String
        }
        
        ${page.typeDefs}
        ${category.typeDefs}
        
        type CmsQuery {
            ${page.queryFields}
            ${category.queryFields}
        }
        
        type CmsMutation {
            ${page.mutationFields}
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
            ...category.queryResolvers
        },
        CmsMutation: {
            ...page.mutationResolvers,
            ...category.mutationResolvers
        },
        Page: {
            createdBy: resolveUser("createdBy"),
            updatedBy: resolveUser("updatedBy")
        }
    },
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
