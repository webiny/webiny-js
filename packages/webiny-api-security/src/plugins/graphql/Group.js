// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import Role from "./Role";

const groupFetcher = ctx => ctx.getModel("SecurityGroup");

export default {
    typeDefs: () => [
        Role.typeDefs,
        /* GraphQL */ `
            input GroupInput {
                id: ID
                name: String
                slug: String
                description: String
                roles: [ID]
            }

            type GroupResponse {
                data: Group
                error: Error
            }

            type GroupListResponse {
                data: [Group]
                meta: ListMeta
                error: Error
            }
        `
    ],
    typeExtensions: `
        extend type SecurityQuery {
            getGroup(
                id: ID 
                where: JSON
                sort: String
            ): GroupResponse
            
            listGroups(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): GroupListResponse
        }
        
        extend type SecurityMutation {
            createGroup(
                data: GroupInput!
            ): GroupResponse
            
            updateGroup(
                id: ID!
                data: GroupInput!
            ): GroupResponse
        
            deleteGroup(
                id: ID!
            ): DeleteResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getGroup: resolveGet(groupFetcher),
            listGroups: resolveList(groupFetcher)
        },
        SecurityMutation: {
            createGroup: resolveCreate(groupFetcher),
            updateGroup: resolveUpdate(groupFetcher),
            deleteGroup: resolveDelete(groupFetcher)
        }
    }
};
