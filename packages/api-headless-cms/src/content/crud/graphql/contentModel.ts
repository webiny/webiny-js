import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { compose, ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql";
import { NotAuthorizedResponse } from "@webiny/api-security";
import {
    CmsContentModelCreateInputType,
    CmsContentModelUpdateInputType,
    CmsContext
} from "@webiny/api-headless-cms/types";
import {
    getCmsManageSettingsPermission,
    hasCmsManageSettingsPermissionRwd,
    hasManageSettingsPermission,
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

export default {
    typeDefs: /* GraphQL */ `
        type CmsContentModel {
            id: ID
            createdOn: DateTime
            changedOn: DateTime
            name: String
            contentModels: [CmsContentModel]
            totalContentModels: Int
            slug: String
            description: String
            icon: String
            createdBy: JSON
        }
        input CmsContentModelInput {
            name: String
            slug: String
            description: String
            icon: String
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
            createContentModel(data: CmsContentModelInput!): CmsContentModelResponse

            updateContentModel(id: ID!, data: CmsContentModelInput!): CmsContentModelResponse

            deleteContentModel(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getContentModel: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
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
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
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
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
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
                        code: "CREATE_CONTENT_GROUP_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateContentModel: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
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
                        code: "UPDATE_CONTENT_GROUP_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteContentModel: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("d"),
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
                        code: "DELETE_CONTENT_GROUP_FAILED",
                        message: ex.message
                    });
                }
            })
        }
    }
};
