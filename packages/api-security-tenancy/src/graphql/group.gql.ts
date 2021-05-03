import deepEqual from "deep-equal";
import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import { SecurityContext } from "@webiny/api-security/types";
import NotAuthorizedResponse from "@webiny/api-security/NotAuthorizedResponse";
import { GroupInput, TenancyContext } from "../types";

const plugin: GraphQLSchemaPlugin<HandlerContext<TenancyContext, SecurityContext>> = {
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

            extend type SecurityQuery {
                getGroup(slug: String): SecurityGroupResponse
                listGroups: SecurityGroupListResponse
            }

            extend type SecurityMutation {
                createGroup(data: SecurityGroupCreateInput!): SecurityGroupResponse
                updateGroup(slug: String!, data: SecurityGroupUpdateInput!): SecurityGroupResponse
                deleteGroup(slug: String!): SecurityBooleanResponse
            }
        `,

        resolvers: {
            SecurityQuery: {
                getGroup: async (_, { slug }: { slug: string }, context) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.group");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const group = await security.groups.getGroup(tenant, slug);

                        if (!group) {
                            return new NotFoundResponse(`Unable to find group with slug: ${slug}`);
                        }

                        return new Response(group);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listGroups: async (_, args, context) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.group");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const groupList = await security.groups.listGroups(tenant);

                        return new ListResponse(groupList);
                    } catch (e) {
                        return new ListErrorResponse(e);
                    }
                }
            },
            SecurityMutation: {
                createGroup: async (_, { data }: { data: GroupInput }, context) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.group");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const groupData = await security.groups.createGroup(tenant, data);

                        return new Response(groupData);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                updateGroup: async (
                    _,
                    { slug, data }: { slug: string; data: Omit<GroupInput, "slug" | "system"> },
                    context
                ) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.group");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const existingGroup = await security.groups.getGroup(tenant, slug);

                        if (!existingGroup) {
                            return new NotFoundResponse(`Group "${slug}" was not found!`);
                        }

                        const permissionsChanged = !deepEqual(
                            data.permissions,
                            existingGroup.permissions
                        );

                        await security.groups.updateGroup(tenant, slug, data);
                        Object.assign(existingGroup, data);

                        if (permissionsChanged) {
                            await security.groups.updateUserLinks(tenant, existingGroup);
                        }

                        return new Response(existingGroup);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                deleteGroup: async (_, { slug }: { slug: string }, context) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.group");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const group = await security.groups.getGroup(tenant, slug);

                        if (!group) {
                            return new NotFoundResponse(`Group "${slug}" was not found!`);
                        }

                        await security.groups.deleteGroup(tenant, slug);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    }
};

export default plugin;
