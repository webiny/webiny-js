// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const roleFetcher = ctx => ctx.security.entities.Role;

export default {
    typeDefs: () => [
        /* GraphQL */ `
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
        `
    ],
    typeExtensions: `
        extend type SecurityQuery {
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
        }
        
        extend type SecurityMutation {
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
        }
    `,
    resolvers: {
        SecurityQuery: {
            getRole: resolveGet(roleFetcher),
            listRoles: resolveList(roleFetcher)
        },
        SecurityMutation: {
            createRole: resolveCreate(roleFetcher),
            updateRole: resolveUpdate(roleFetcher),
            deleteRole: resolveDelete(roleFetcher)
        }
    }
};
