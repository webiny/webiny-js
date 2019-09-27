// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";

const groupFetcher = ctx => ctx.models.SecurityGroup;

export default {
    typeDefs: /* GraphQL */ `
        type SecurityGroup {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            roles: [SecurityRole]
        }

        input SecurityGroupInput {
            id: ID
            name: String
            slug: String
            description: String
            roles: [ID]
        }

        input SecurityGroupSearchInput {
            query: String
            fields: [String]
            operator: String
        }

        type SecurityGroupListMeta {
            totalCount: Int
            totalPages: Int
            page: Int
            perPage: Int
            from: Int
            to: Int
            previousPage: Int
            nextPage: Int
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
            meta: SecurityGroupListMeta
            error: SecurityGroupError
        }
        extend type SecurityQuery {
            getGroup(id: ID, where: JSON, sort: String): SecurityGroupResponse

            listGroups(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SecurityGroupSearchInput
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
