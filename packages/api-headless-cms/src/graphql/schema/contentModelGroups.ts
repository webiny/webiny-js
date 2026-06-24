import { ErrorResponse, NotFoundError, Response } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { CmsContext } from "~/types/index.js";
import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/index.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { CreateGroupUseCase } from "~/features/contentModelGroup/CreateGroup/index.js";
import { UpdateGroupUseCase } from "~/features/contentModelGroup/UpdateGroup/index.js";
import { DeleteGroupUseCase } from "~/features/contentModelGroup/DeleteGroup/index.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import { HeadlessCmsEnhancerConfig } from "~/HeadlessCmsContextEnhancer.js";

interface Params {
    context: CmsContext;
}
export const createGroupsSchema = ({ context }: Params): ICmsGraphQLSchemaPlugin => {
    const isManage = context.container.resolve(HeadlessCmsEnhancerConfig).type === "manage";

    let manageSchema = "";
    if (isManage) {
        manageSchema = /* GraphQL */ `
            input CmsContentModelGroupInput {
                id: ID
                name: String!
                slug: String
                description: String
                icon: Icon!
            }

            type CmsContentModelGroupResponse {
                data: CmsContentModelGroup
                error: CmsError
            }

            type CmsContentModelGroupListResponse {
                data: [CmsContentModelGroup]
                meta: CmsListMeta
                error: CmsError
            }

            extend type Query {
                getContentModelGroup(id: ID): CmsContentModelGroupResponse
                listContentModelGroups: CmsContentModelGroupListResponse
            }

            extend type Mutation {
                createContentModelGroup(
                    data: CmsContentModelGroupInput!
                ): CmsContentModelGroupResponse

                updateContentModelGroup(
                    id: ID!
                    data: CmsContentModelGroupInput!
                ): CmsContentModelGroupResponse

                deleteContentModelGroup(id: ID!): CmsDeleteResponse
            }
        `;
    }

    let resolvers: Resolvers<CmsContext> = {};

    if (isManage) {
        resolvers = {
            CmsContentModelGroup: {
                contentModels: async (group, _, context) => {
                    const result = await context.container
                        .resolve(IdentityContext)
                        .withoutAuthorization(async () => {
                            return context.container.resolve(ListModelsUseCase).execute();
                        });
                    if (result.isFail()) {
                        return [];
                    }
                    return result.value.filter(model => {
                        if (model.isPrivate === true) {
                            return false;
                        }
                        return model.group === group.slug;
                    });
                },
                totalContentModels: async (group, _, context) => {
                    const result = await context.container
                        .resolve(IdentityContext)
                        .withoutAuthorization(async () => {
                            return context.container.resolve(ListModelsUseCase).execute();
                        });
                    if (result.isFail()) {
                        return 0;
                    }
                    return result.value.filter(model => {
                        if (model.isPrivate === true) {
                            return false;
                        }
                        return model.group === group.slug;
                    }).length;
                },
                plugin: async (group, _, context) => {
                    const pluginGroups = await context.container
                        .resolve(PluginGroupsProvider)
                        .getGroups();
                    return pluginGroups.some(pg => pg.id === group.id);
                }
            },
            Query: {
                getContentModelGroup: async (_, args: any, context) => {
                    try {
                        const { id } = args;
                        const result = await context.container.resolve(GetGroupUseCase).execute(id);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        const group = result.value;
                        if (group?.isPrivate) {
                            throw new NotFoundError(`Cms Group "${id}" was not found!`);
                        }
                        return new Response(group);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listContentModelGroups: async (_, __, context) => {
                    try {
                        const result = await context.container.resolve(ListGroupsUseCase).execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return new Response(result.value.filter(group => group.isPrivate !== true));
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            Mutation: {
                createContentModelGroup: async (_, args: any, context) => {
                    try {
                        const result = await context.container
                            .resolve(CreateGroupUseCase)
                            .execute(args.data);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return new Response(result.value);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                updateContentModelGroup: async (_, args: any, context) => {
                    try {
                        const result = await context.container
                            .resolve(UpdateGroupUseCase)
                            .execute(args.id, args.data);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return new Response(result.value);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                deleteContentModelGroup: async (_, args: any, context) => {
                    try {
                        const result = await context.container
                            .resolve(DeleteGroupUseCase)
                            .execute(args.id);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        };
    }

    const plugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsContentModelGroup {
                id: ID!
                createdOn: DateTime
                savedOn: DateTime
                name: String!
                contentModels: [CmsContentModel!]
                totalContentModels: Int!
                slug: String!
                description: String
                icon: Icon
                createdBy: CmsIdentity

                # Returns true if the content model group is registered via a plugin.
                plugin: Boolean!
            }
            ${manageSchema}
        `,
        resolvers
    });

    const endpointType = context.container.resolve(HeadlessCmsEnhancerConfig).type;
    plugin.name = `headless-cms.graphql.schema.${endpointType}.content-model-groups`;

    return plugin;
};
