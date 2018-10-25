import { dummyResolver } from "webiny-api/graphql";
import setupEntities from "./setupEntities";
import resolveUser from "./schemas/typeResolvers/resolveUser";

import page from "./schemas/Page.schema";
import category from "./schemas/Category.schema";
import revision from "./schemas/Revision.schema";
import menu from "./schemas/Menu.schema";

export default {
    namespace: "cms",
    typeDefs: `
        type Author {
            id: ID
            firstName: String
            lastName: String
            email: String
        }
        
        ${revision.typeDefs}
        ${page.typeDefs}
        ${category.typeDefs}
        ${menu.typeDefs}
        
        type CmsQuery {
            ${page.queryFields}
            ${revision.queryFields}
            ${category.queryFields}
            ${menu.queryFields}
        }
        
        type CmsMutation {
            ${page.mutationFields}
            ${revision.mutationFields}
            ${category.mutationFields}
            ${menu.mutationFields}
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
            ...category.queryResolvers,
            ...menu.queryResolvers
        },
        CmsMutation: {
            ...page.mutationResolvers,
            ...revision.mutationResolvers,
            ...category.mutationResolvers,
            ...menu.mutationResolvers
        },
        Revision: {
            createdBy: resolveUser("createdBy"),
            updatedBy: resolveUser("updatedBy")
        },
        Menu: {
            createdBy: resolveUser("createdBy"),
            updatedBy: resolveUser("updatedBy")
        },
        Page: {
            createdBy: resolveUser("createdBy")
        }
    },
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
