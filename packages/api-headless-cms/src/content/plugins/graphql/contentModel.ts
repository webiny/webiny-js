import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { compose, ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql";
import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import {
    CmsContentModelCreateInputType,
    CmsContentModelUpdateInputType,
    CmsContext
} from "@webiny/api-headless-cms/types";
import {
    getCmsManageSettingsPermission,
    hasRwdPermission,
    userCanManageModel
} from "@webiny/api-headless-cms/common/helpers";

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

export default {
    typeDefs: /* GraphQL */ `
        type CmsContentModel {
            id: ID!
            name: String!
            code: String!
            description: String
            createdOn: DateTime!
            changedOn: DateTime
            createdBy: JSON!
        }

        input CmsContentModelCreateInput {
            name: String!
            code: String!
            group: ID!
            description: String
        }

        input CmsContentModelUpdateInput {
            name: String!
            code: String!
            group: ID!
            description: String
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

        extend type CmsQuery {
            getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse

            listContentModel(
                where: JSON
                sort: JSON
                search: CmsSearchInput
                limit: Int
                after: String
                before: String
            ): CmsContentModelListResponse
        }

        extend type CmsMutation {
            createContentModel(data: CmsContentModelCreateInput!): CmsContentModelResponse

            updateContentModel(id: ID!, data: CmsContentModelUpdateInput!): CmsContentModelResponse

            deleteContentModel(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
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
            listContentModel: compose(
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
        },
        CmsMutation: {
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
        }
    }
};
