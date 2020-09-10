import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const groupFetcher = ctx => ctx.models.SecurityGroup;

export default {
    typeDefs: /* GraphQL */ `
        type SecurityGroup {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            #roles: [SecurityRole]
            permissions: [JSON]
        }

        input SecurityGroupInput {
            id: ID
            name: String
            slug: String
            description: String
            #roles: [ID]
            permissions: [JSON]
        }

        input SecurityGroupSearchInput {
            query: String
            fields: [String]
            operator: String
        }

        type SecurityGroupError {
            code: String
            message: String
            data: JSON
        }

        type SecurityGroupDeleteResponse {
            data: Boolean
            error: SecurityGroupError
        }

        type SecurityGroupResponse {
            data: SecurityGroup
            error: SecurityGroupError
        }

        type SecurityGroupListResponse {
            data: [SecurityGroup]
            meta: SecurityListMeta
            error: SecurityGroupError
        }
        extend type SecurityQuery {
            getGroup(id: ID, where: JSON, sort: String): SecurityGroupResponse

            listGroups(
                where: JSON
                sort: JSON
                search: SecurityGroupSearchInput
                limit: Int
                after: String
                before: String
            ): SecurityGroupListResponse
        }

        extend type SecurityMutation {
            createGroup(data: SecurityGroupInput!): SecurityGroupResponse
            updateGroup(id: ID!, data: SecurityGroupInput!): SecurityGroupResponse
            deleteGroup(id: ID!): SecurityGroupDeleteResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getGroup: hasScope("security:group:crud")(resolveGet(groupFetcher)),
            listGroups: hasScope("security:group:crud")(resolveList(groupFetcher))
        },
        SecurityMutation: {
            createGroup: hasScope("security:group:crud")(resolveCreate(groupFetcher)),
            updateGroup: hasScope("security:group:crud")(resolveUpdate(groupFetcher)),
            deleteGroup: hasScope("security:group:crud")(resolveDelete(groupFetcher))
        }
    }
};
