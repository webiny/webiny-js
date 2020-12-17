import {
    CmsContentModelGroupCreateInputType,
    CmsContentModelGroupUpdateInputType,
    CmsContext
} from "../../../types";

import { GraphQLSchemaPlugin, Resolvers } from "@webiny/handler-graphql/types";
import { compose, ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql";
import {
    getCmsManageSettingsPermission,
    hasCmsManageSettingsPermissionRwd,
    hasManageSettingsPermission,
    userCanManageModel
} from "@webiny/api-headless-cms/utils";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { NotAuthorizedResponse } from "@webiny/api-security";

type CreateContentModelGroupArgsType = {
    data: CmsContentModelGroupCreateInputType;
};

type ReadContentModelGroupArgsType = {
    id: string;
};

type UpdateContentModelGroupArgsType = ReadContentModelGroupArgsType & {
    data: CmsContentModelGroupUpdateInputType;
};

type DeleteContentModelGroupArgsType = {
    id: string;
};

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    let manageSchema = "";
    if (context.cms.MANAGE) {
        manageSchema = /* GraphQL */ `
            input CmsContentModelGroupInput {
                name: String
                slug: String
                description: String
                icon: String
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
                contentModels: async (group, args, context) => {
                    const models = await context.cms.models.list();
                    return models.filter(m => m.group === group.id);
                },
                totalContentModels: async (group, args, context) => {
                    const models = await context.cms.models.list();
                    return models.filter(m => m.group === group.id).length;
                }
            },
            Query: {
                getContentModelGroup: compose(
                    hasManageSettingsPermission(),
                    hasCmsManageSettingsPermissionRwd("r"),
                    hasI18NContentPermission()
                )(async (_, args: ReadContentModelGroupArgsType, context: CmsContext) => {
                    const permission = await getCmsManageSettingsPermission(context);
                    const { id } = args;
                    const model = await context.cms.groups.get(id);
                    if (!model) {
                        return new NotFoundResponse(`CMS Content model group "${id}" not found.`);
                    }
                    if (
                        permission.own === true &&
                        !userCanManageModel(context.security.getIdentity(), model)
                    ) {
                        return new NotAuthorizedResponse();
                    }
                    return new Response(model);
                }),
                listContentModelGroups: compose(
                    hasManageSettingsPermission(),
                    hasCmsManageSettingsPermissionRwd("r"),
                    hasI18NContentPermission()
                )(async (_, __, context: CmsContext) => {
                    const permission = await getCmsManageSettingsPermission(context);
                    const models = await context.cms.groups.list();
                    if (permission.own === true) {
                        const identity = context.security.getIdentity();
                        return new Response(
                            models.filter(model => userCanManageModel(identity, model))
                        );
                    }
                    return new Response(models);
                })
            },
            Mutation: {
                createContentModelGroup: compose(
                    hasManageSettingsPermission(),
                    hasCmsManageSettingsPermissionRwd("w"),
                    hasI18NContentPermission()
                )(async (_, args: CreateContentModelGroupArgsType, context: CmsContext) => {
                    const identity = context.security.getIdentity();

                    const { data } = args;
                    const createdBy = {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    };

                    try {
                        const model = await context.cms.groups.create(data, createdBy);
                        return new Response(model);
                    } catch (ex) {
                        return new ErrorResponse({
                            code: "CREATE_CONTENT_MODEL_GROUP_FAILED",
                            message: ex.message
                        });
                    }
                }),
                updateContentModelGroup: compose(
                    hasManageSettingsPermission(),
                    hasCmsManageSettingsPermissionRwd("w"),
                    hasI18NContentPermission()
                )(async (_, args: UpdateContentModelGroupArgsType, context: CmsContext) => {
                    const permission = await getCmsManageSettingsPermission(context);

                    const { id, data } = args;

                    const model = await context.cms.groups.get(id);
                    if (!model) {
                        return new NotFoundResponse(`CMS Content model group "${id}" not found.`);
                    }

                    if (
                        permission.own === true &&
                        !userCanManageModel(context.security.getIdentity(), model)
                    ) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const changedModel = await context.cms.groups.update(id, data);
                        return new Response({ ...model, ...changedModel });
                    } catch (ex) {
                        return new ErrorResponse({
                            code: "UPDATE_CONTENT_MODEL_GROUP_FAILED",
                            message: ex.message
                        });
                    }
                }),
                deleteContentModelGroup: compose(
                    hasManageSettingsPermission(),
                    hasCmsManageSettingsPermissionRwd("d"),
                    hasI18NContentPermission()
                )(async (_, args: DeleteContentModelGroupArgsType, context: CmsContext) => {
                    const { id } = args;
                    const permission = await getCmsManageSettingsPermission(context);

                    const model = await context.cms.groups.get(id);
                    if (!model) {
                        return new NotFoundResponse(`CMS Content model group "${id}" not found.`);
                    }

                    if (
                        permission.own === true &&
                        !userCanManageModel(context.security.getIdentity(), model)
                    ) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        await context.cms.groups.delete(id);
                        return new Response(true);
                    } catch (ex) {
                        return new ErrorResponse({
                            code: "DELETE_CONTENT_MODEL_GROUP_FAILED",
                            message: ex.message
                        });
                    }
                })
            }
        };
    }

    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsContentModelGroup {
                    id: ID
                    createdOn: DateTime
                    savedOn: DateTime
                    name: String
                    contentModels: [CmsContentModel]
                    totalContentModels: Int
                    slug: String
                    description: String
                    icon: String
                    createdBy: JSON
                }
                ${manageSchema}
            `,
            resolvers
        }
    };
};

export default plugin;
