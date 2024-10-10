import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { SecurityContext } from "~/types";

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type SecurityGroup {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            permissions: [JSON]
            system: Boolean!
            plugin: Boolean
        }

        input SecurityGroupCreateInput {
            name: String!
            slug: String!
            description: String
            permissions: [JSON!]!
        }

        input SecurityGroupUpdateInput {
            name: String
            description: String
            permissions: [JSON!]
        }

        type SecurityGroupResponse {
            data: SecurityGroup
            error: SecurityError
        }

        type SecurityGroupListResponse {
            data: [SecurityGroup]
            error: SecurityError
        }

        input GetGroupWhereInput {
            id: ID
            slug: String
        }

        extend type SecurityQuery {
            getGroup(where: GetGroupWhereInput!): SecurityGroupResponse
            listGroups: SecurityGroupListResponse
        }

        extend type SecurityMutation {
            createGroup(data: SecurityGroupCreateInput!): SecurityGroupResponse
            updateGroup(id: ID!, data: SecurityGroupUpdateInput!): SecurityGroupResponse
            deleteGroup(id: ID!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getGroup: async (_, { where }, context) => {
                try {
                    const group = await context.security.getGroup({ where });
                    return new Response(group);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listGroups: async (_, __, context) => {
                try {
                    const groupList = await context.security.listGroups();

                    return new ListResponse(groupList);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            createGroup: async (_, { data }, context) => {
                try {
                    const group = await context.security.createGroup(data);

                    return new Response(group);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateGroup: async (_, { id, data }, context) => {
                try {
                    const group = await context.security.updateGroup(id, data);
                    return new Response(group);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteGroup: async (_, { id }, context) => {
                try {
                    await context.security.deleteGroup(id);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
