import { hasScope } from "@webiny/api-security";
import createGroup from "./groupResolvers/createGroup";
import listGroup from "./groupResolvers/listGroup";
import updateGroup from "./groupResolvers/updateGroup";
import deleteGroup from "./groupResolvers/deleteGroup";
import getGroup from "./groupResolvers/getGroup";

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

        input ListSecurityGroupWhereInput {
            nameBeginsWith: String
        }

        extend type SecurityQuery {
            getGroup(id: ID, slug: String): SecurityGroupResponse

            listGroups(where: ListSecurityGroupWhereInput, sort: Int): SecurityGroupListResponse
        }

        extend type SecurityMutation {
            createGroup(data: SecurityGroupInput!): SecurityGroupResponse
            updateGroup(id: ID!, data: SecurityGroupInput!): SecurityGroupResponse
            deleteGroup(id: ID!): SecurityGroupDeleteResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getGroup: hasScope("security.group.manage")(getGroup),
            listGroups: hasScope("security.group.manage")(listGroup)
        },
        SecurityMutation: {
            createGroup: hasScope("security.group.manage")(createGroup),
            updateGroup: hasScope("security.group.manage")(updateGroup),
            deleteGroup: hasScope("security.group.manage")(deleteGroup)
        }
    }
};
