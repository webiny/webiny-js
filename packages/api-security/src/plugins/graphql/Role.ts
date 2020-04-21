import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";

const roleFetcher = ctx => ctx.models.SecurityRole;

export default {
    /* GraphQL */
    typeDefs: `
        type SecurityRole {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            scopes: [String]
        }

        input SecurityRoleInput {
            id: ID
            name: String
            slug: String
            description: String
            scopes: [String]
        }
        
        input SecurityRoleSearchInput {
            query: String
            fields: [String]
            operator: String
        }

        type SecurityRoleError {
            code: String
            message: String
            data: JSON
        }

        type SecurityRoleDeleteResponse {
            data: Boolean
            error: SecurityRoleError
        }

        type SecurityRoleResponse {
            data: SecurityRole
            error: SecurityRoleError
        }

        type SecurityRoleListResponse {
            data: [SecurityRole]
            meta: SecurityListMeta
            error: SecurityRoleError
        }

        extend type SecurityQuery {
            getRole(id: ID, where: JSON, sort: String): SecurityRoleResponse

            listRoles(
                where: JSON
                sort: JSON
                search: SecurityRoleSearchInput
                limit: Int
                after: String
                before: String
            ): SecurityRoleListResponse
        }

        extend type SecurityMutation {
            createRole(data: SecurityRoleInput!): SecurityRoleResponse
            updateRole(id: ID!, data: SecurityRoleInput!): SecurityRoleResponse
            deleteRole(id: ID!): SecurityRoleDeleteResponse
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
