import { ErrorResponse, Response } from "@webiny/handler-graphql";

import { CmsGroupCreateInput, CmsGroupUpdateInput, CmsContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { Resolvers } from "@webiny/handler-graphql/types";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";

interface CreateCmsGroupArgs {
    data: CmsGroupCreateInput;
}

interface ReadCmsGroupArgs {
    id: string;
}

interface UpdateCmsGroupArgs extends ReadCmsGroupArgs {
    data: CmsGroupUpdateInput;
}

interface DeleteCmsGroupArgs {
    id: string;
}

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    let manageSchema = "";
    if (context.cms.MANAGE) {
        manageSchema = /* GraphQL */ `
            input CmsContentModelGroupInput {
                name: String!
                slug: String
                description: String
                icon: String!
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

    if (context.cms.MANAGE) {
        resolvers = {
            CmsContentModelGroup: {
                contentModels: async (group, _, context) => {
                    context.security.disableAuthorization();
                    const models = await context.cms.listModels();
                    context.security.enableAuthorization();
                    return models.filter(m => m.group.id === group.id);
                },
                totalContentModels: async (group, _, context) => {
                    context.security.disableAuthorization();
                    const models = await context.cms.listModels();
                    context.security.enableAuthorization();
                    return models.filter(m => m.group === group.id).length;
                },
                plugin: async (group, _, context: CmsContext): Promise<boolean> => {
                    return context.plugins
                        .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
                        .some(item => item.contentModelGroup.id === group.id);
                }
            },
            Query: {
                getContentModelGroup: async (_, args: ReadCmsGroupArgs, context) => {
                    try {
                        const { id } = args;
                        const model = await context.cms.getGroup(id);
                        return new Response(model);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listContentModelGroups: async (_, __, context) => {
                    try {
                        const models = await context.cms.listGroups();
                        return new Response(models);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            Mutation: {
                createContentModelGroup: async (_, args: CreateCmsGroupArgs, context) => {
                    try {
                        const model = await context.cms.createGroup(args.data);
                        return new Response(model);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                updateContentModelGroup: async (_, args: UpdateCmsGroupArgs, context) => {
                    try {
                        const group = await context.cms.updateGroup(args.id, args.data);
                        return new Response(group);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                deleteContentModelGroup: async (_, args: DeleteCmsGroupArgs, context) => {
                    try {
                        await context.cms.deleteGroup(args.id);
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        };
    }

    return new GraphQLSchemaPlugin<CmsContext>({
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
                icon: String
                createdBy: CmsCreatedBy

                # Returns true if the content model group is registered via a plugin.
                plugin: Boolean!
            }
            ${manageSchema}
        `,
        resolvers
    });
};

export default plugin;
