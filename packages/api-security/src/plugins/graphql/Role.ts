import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

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

        type SecurityRoleListMeta {
            totalCount: Int
            totalPages: Int
            page: Int
            perPage: Int
            from: Int
            to: Int
            previousPage: Int
            nextPage: Int
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
            meta: SecurityRoleListMeta
            error: SecurityRoleError
        }

        extend type SecurityQuery {
            getRole(id: ID, where: JSON, sort: String): SecurityRoleResponse

            listRoles(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SecurityRoleSearchInput
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
            getRole: hasScope("security:role:crud")(resolveGet(roleFetcher)),
            listRoles: hasScope("security:role:crud")(resolveList(roleFetcher))
        },
        SecurityMutation: {
            createRole: hasScope("security:role:crud")(resolveCreate(roleFetcher)),
            updateRole: hasScope("security:role:crud")(resolveUpdate(roleFetcher)),
            deleteRole: hasScope("security:role:crud")(resolveDelete(roleFetcher))
        }
    }
};
