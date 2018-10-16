// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const groupFetcher = ctx => ctx.security.Group;

export default {
    typeDefs: `
        type Group {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            roles: [Role]
        }
        
        input GroupInput {
            id: ID
            name: String
            slug: String
            description: String
            roles: [RoleInput]
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
    `,
    queryFields: `
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
    `,
    mutationFields: `
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
    `,
    queryResolvers: {
        getGroup: resolveGet(groupFetcher),
        listGroups: resolveList(groupFetcher)
    },
    mutationResolvers: {
        createGroup: resolveCreate(groupFetcher),
        updateGroup: resolveUpdate(groupFetcher),
        deleteGroup: resolveDelete(groupFetcher)
    }
};
