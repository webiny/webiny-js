import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { compose, ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql";
import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    CmsContentModelCreateInputType,
    CmsContentModelUpdateInputType,
    CmsContext
} from "@webiny/api-headless-cms/types";
import {
    getCmsManageSettingsPermission,
    hasRwdPermission,
    userCanManageModel
} from "@webiny/api-headless-cms/utils";

type CreateContentModelArgsType = {
    data: CmsContentModelCreateInputType;
};

type ReadContentModelArgsType = {
    id: string;
};

type UpdateContentModelArgsType = ReadContentModelArgsType & {
    data: CmsContentModelUpdateInputType;
};

type DeleteContentModelArgsType = {
    id: string;
};

const PERMISSION_NAME = "cms.manage.contentModel";

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    const resolvers: Record<string, any> = {
        Query: {
            getContentModel: compose(
                hasPermission(PERMISSION_NAME),
                hasRwdPermission(PERMISSION_NAME, "r"),
                hasI18NContentPermission()
            )(async (_, args: ReadContentModelArgsType, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);
                const { id } = args;
                const model = await context.cms.models.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Content model "${id}" not found.`);
                }
                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }
                return new Response(model);
            }),
            listContentModels: compose(
                hasPermission(PERMISSION_NAME),
                hasRwdPermission(PERMISSION_NAME, "r"),
                hasI18NContentPermission()
            )(async (_, __, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);
                const models = await context.cms.models.list();
                if (permission.own === true) {
                    const identity = context.security.getIdentity();
                    return new Response(
                        models.filter(model => userCanManageModel(identity, model))
                    );
                }
                return new Response(models);
            })
        }
    };

    let manageSchema = "";
    if (context.cms.MANAGE) {
        resolvers.Mutation = {
            createContentModel: compose(
                hasPermission(PERMISSION_NAME),
                hasRwdPermission(PERMISSION_NAME, "w"),
                hasI18NContentPermission()
            )(async (_, args: CreateContentModelArgsType, context: CmsContext) => {
                const identity = context.security.getIdentity();

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.displayName
                };

                try {
                    const model = await context.cms.models.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "CREATE_CONTENT_MODEL_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateContentModel: compose(
                hasPermission(PERMISSION_NAME),
                hasRwdPermission(PERMISSION_NAME, "w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateContentModelArgsType, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id, data } = args;

                const model = await context.cms.models.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Content model "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    const changedModel = await context.cms.models.update(model, data);
                    return new Response({ ...model, ...changedModel });
                } catch (ex) {
                    return new ErrorResponse({
                        code: "UPDATE_CONTENT_MODEL_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteContentModel: compose(
                hasPermission(PERMISSION_NAME),
                hasRwdPermission(PERMISSION_NAME, "d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteContentModelArgsType, context: CmsContext) => {
                const { id } = args;
                const permission = await getCmsManageSettingsPermission(context);

                const model = await context.cms.models.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Content model "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    await context.cms.models.delete(model);
                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "DELETE_CONTENT_MODEL_FAILED",
                        message: ex.message
                    });
                }
            })
        };

        manageSchema = /* GraphQL */ `
            input CmsContentModelCreateInput {
                name: String!
                modelId: String!
                group: ID!
                description: String
            }

            input CmsContentModelUpdateInput {
                name: String!
                modelId: String!
                group: ID!
                description: String
            }

            extend type Mutation {
                createContentModel(data: CmsContentModelCreateInput!): CmsContentModelResponse

                updateContentModel(
                    id: ID!
                    data: CmsContentModelUpdateInput!
                ): CmsContentModelResponse

                deleteContentModel(id: ID!): CmsDeleteResponse
            }
        `;
    }

    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsContentModel {
                    id: ID!
                    name: String!
                    modelId: String!
                    description: String
                    group: CmsContentModelGroup!
                    createdOn: DateTime!
                    changedOn: DateTime
                    createdBy: JSON!
                }

                type CmsContentModelResponse {
                    data: CmsContentModel
                    error: CmsError
                }

                type CmsContentModelListResponse {
                    data: [CmsContentModel]
                    meta: CmsListMeta
                    error: CmsError
                }

                extend type Query {
                    getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse

                    listContentModels: CmsContentModelListResponse
                }

                ${manageSchema}
            `,
            resolvers
        }
    };
};

export default plugin;
