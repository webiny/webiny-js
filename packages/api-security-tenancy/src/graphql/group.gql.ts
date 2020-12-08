import deepEqual from "deep-equal";
import { hasPermission } from "@webiny/api-security";
import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { GroupInput, TenancyContext } from "../types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import { SecurityContext } from "@webiny/api-security/types";

type Context = HandlerContext<TenancyContext, SecurityContext>;

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-security-group",
    schema: {
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

            type SecurityGroupResponse {
                data: SecurityGroup
                error: SecurityError
            }

            type SecurityGroupListResponse {
                data: [SecurityGroup]
                error: SecurityError
            }

            extend type SecurityQuery {
                getGroup(slug: String): SecurityGroupResponse
                listGroups: SecurityGroupListResponse
            }

            extend type SecurityMutation {
                createGroup(data: SecurityGroupInput!): SecurityGroupResponse
                updateGroup(slug: String!, data: SecurityGroupInput!): SecurityGroupResponse
                deleteGroup(slug: String!): SecurityBooleanResponse
            }
        `,

        resolvers: {
            SecurityQuery: {
                getGroup: hasPermission("security.group")(
                    async (_, { slug }: { slug: string }, context: Context) => {
                        try {
                            const tenant = context.security.getTenant();
                            const group = await context.security.groups.getGroup(tenant, slug);

                            if (!group) {
                                return new NotFoundResponse(
                                    `Unable to find group with slug: ${slug}`
                                );
                            }

                            return new Response(group);
                        } catch (e) {
                            return new ErrorResponse({
                                message: e.message,
                                code: e.code,
                                data: e.data || null
                            });
                        }
                    }
                ),
                listGroups: hasPermission("security.group")(async (_, args, context: Context) => {
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
                })
            },
            SecurityMutation: {
                createGroup: hasPermission("security.group")(
                    async (_, { data }: { data: GroupInput }, context: Context) => {
                        try {
                            const tenant = context.security.getTenant();
                            const groupData = await context.security.groups.createGroup(
                                tenant,
                                data
                            );

                            return new Response(groupData);
                        } catch (e) {
                            return new ErrorResponse({
                                code: e.code,
                                message: e.message,
                                data: e.data
                            });
                        }
                    }
                ),
                updateGroup: hasPermission("security.group")(
                    async (
                        _,
                        { slug, data }: { slug: string; data: Omit<GroupInput, "slug" | "system"> },
                        context: Context
                    ) => {
                        try {
                            const tenant = context.security.getTenant();
                            const existingGroup = await context.security.groups.getGroup(
                                tenant,
                                slug
                            );

                            if (!existingGroup) {
                                return new NotFoundResponse(`Group "${slug}" was not found!`);
                            }

                            const permissionsChanged = !deepEqual(
                                data.permissions,
                                existingGroup.permissions
                            );

                            await context.security.groups.updateGroup(tenant, slug, data);
                            Object.assign(existingGroup, data);

                            if (permissionsChanged) {
                                await context.security.groups.updateUserLinks(
                                    tenant,
                                    existingGroup
                                );
                            }

                            return new Response(existingGroup);
                        } catch (e) {
                            return new ErrorResponse({
                                code: e.code,
                                message: e.message,
                                data: e.data || null
                            });
                        }
                    }
                ),
                deleteGroup: hasPermission("security.group")(
                    async (_, { slug }: { slug: string }, context: Context) => {
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
                    }
                )
            }
        }
    }
};

export default plugin;
