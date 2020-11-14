import deepEqual from "deep-equal";
import { hasPermission } from "@webiny/api-security";

import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/graphql";
import { GroupData, HandlerTenancyContext } from "../types";

export default {
    typeDefs: /* GraphQL */ `
        type SecurityGroup {
            name: String
            slug: String
            createdOn: DateTime
            description: String
            permissions: [JSON]
        }

        input SecurityGroupInput {
            name: String
            slug: String
            description: String
            permissions: [JSON]
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
            error: SecurityGroupError
        }

        extend type SecurityQuery {
            getGroup(slug: String): SecurityGroupResponse
            listGroups: SecurityGroupListResponse
        }

        extend type SecurityMutation {
            createGroup(data: SecurityGroupInput!): SecurityGroupResponse
            updateGroup(slug: String!, data: SecurityGroupInput!): SecurityGroupResponse
            deleteGroup(slug: String!): SecurityGroupDeleteResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getGroup: hasPermission<any, { slug: string }, HandlerTenancyContext>(
                "security.group.manage"
            )(async (_, { slug }, context) => {
                try {
                    const tenant = context.security.getTenant();
                    const group = await context.security.groups.getGroup(tenant, slug);

                    if (!group) {
                        return new NotFoundResponse(`Unable to find group with slug: ${slug}`);
                    }

                    return new Response(group);
                } catch (e) {
                    return new ErrorResponse({
                        message: e.message,
                        code: e.code,
                        data: e.data || null
                    });
                }
            }),
            listGroups: hasPermission<any, any, HandlerTenancyContext>("security.group.manage")(
                async (_, args, context) => {
                    try {
                        const tenant = context.security.getTenant();
                        const groupList = await context.security.groups.listGroups(tenant);

                        return new ListResponse(groupList);
                    } catch (e) {
                        return new ListErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data || null
                        });
                    }
                }
            )
        },
        SecurityMutation: {
            createGroup: hasPermission<any, { data: GroupData }, HandlerTenancyContext>(
                "security.group.manage"
            )(async (_, { data }, context) => {
                try {
                    const tenant = context.security.getTenant();
                    const groupData = await context.security.groups.createGroup(tenant, data);

                    return new Response(groupData);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }),
            updateGroup: hasPermission<
                any,
                { slug: string; data: Omit<GroupData, "slug" | "system"> },
                HandlerTenancyContext
            >("security.group.manage")(async (_, { slug, data }, context) => {
                try {
                    const tenant = context.security.getTenant();
                    const existingGroup = await context.security.groups.getGroup(tenant, slug);

                    if (!existingGroup) {
                        return new NotFoundResponse(`Group "${slug}" was not found!`);
                    }

                    const permissionsChanged = !deepEqual(
                        data.permissions,
                        existingGroup.permissions
                    );

                    await context.security.groups.updateGroup(tenant, slug, data);

                    if (permissionsChanged) {
                        await context.security.groups.updatePermissionsOnUsersInGroup(
                            tenant,
                            slug,
                            data.permissions
                        );
                    }

                    return new Response(Object.assign({}, existingGroup, data));
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data || null
                    });
                }
            }),
            deleteGroup: hasPermission<any, { slug: string }, HandlerTenancyContext>(
                "security.group.manage"
            )(async (_, { slug }, context) => {
                try {
                    const tenant = context.security.getTenant();
                    const group = await context.security.groups.getGroup(tenant, slug);

                    if (!group) {
                        return new NotFoundResponse(`Group "${slug}" was not found!`);
                    }

                    await context.security.groups.deleteGroup(tenant, slug);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse({
                        message: e.message,
                        code: e.code,
                        data: e.data || null
                    });
                }
            })
        }
    }
};
