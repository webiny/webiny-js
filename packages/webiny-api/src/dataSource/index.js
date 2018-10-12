import { dummyResolver } from "../graphql";
import setupEntities from "./setupEntities";
import role from "./schemas/Role.schema";
import group from "./schemas/Group.schema";
import user from "./schemas/User.schema";
import apiToken from "./schemas/ApiToken.schema";

export default {
    namespace: "security",
    scopes: ["superadmin", "users:read", "users:write"],
    typeDefs: `
        ${role.typeDefs}
        ${group.typeDefs}
        ${user.typeDefs}
        ${apiToken.typeDefs}
        
        type Query {
            security: SecurityQuery
        }
        
        type Mutation {
            security: SecurityMutation
        }
        
        type SecurityQuery {
            ${role.queryFields}
            ${group.queryFields}
            ${user.queryFields}
            ${apiToken.queryFields}
            scopes: [String]
        }
        
        type SecurityMutation {
            ${role.mutationFields}
            ${group.mutationFields}
            ${user.mutationFields}
            ${apiToken.mutationFields}
        }
    `,
    resolvers: {
        Query: {
            security: dummyResolver
        },
        Mutation: {
            security: dummyResolver
        },
        SecurityQuery: {
            ...role.queryResolvers,
            ...group.queryResolvers,
            ...user.queryResolvers,
            ...apiToken.queryResolvers
        },
        SecurityMutation: {
            ...role.mutationResolvers,
            ...group.mutationResolvers,
            ...user.mutationResolvers,
            ...apiToken.mutationResolvers
        }
    },
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
