// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const roleFetcher = ctx => ctx.security.Role;

export default {
    typeDefs: `
        type Role {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            scopes: [String]
        }
        
        input RoleInput {
            id: ID
            name: String
            slug: String
            description: String
            scopes: [String]
        }
        
        type RoleResponse {
            data: Role
            error: Error
        }
        
        type RoleListResponse {
            data: [Role]
            meta: ListMeta
            error: Error
        }
    `,
    queryFields: `
        getRole(
            id: ID 
            where: JSON
            sort: String
        ): RoleResponse
        
        listRoles(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): RoleListResponse
    `,
    mutationFields: `
        createRole(
            data: RoleInput!
        ): RoleResponse
        
        updateRole(
            id: ID!
            data: RoleInput!
        ): RoleResponse
    
        deleteRole(
            id: ID!
        ): DeleteResponse
    `,
    queryResolvers: {
        getRole: resolveGet(roleFetcher),
        listRoles: resolveList(roleFetcher)
    },
    mutationResolvers: {
        createRole: resolveCreate(roleFetcher),
        updateRole: resolveUpdate(roleFetcher),
        deleteRole: resolveDelete(roleFetcher)
    }
};
