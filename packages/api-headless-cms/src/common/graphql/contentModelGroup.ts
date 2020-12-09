import {
    CmsContentModelGroupCreateInputType,
    CmsContentModelGroupUpdateInputType,
    CmsContext
} from "../../types";
import {
    getCmsManageSettingsPermission,
    hasCmsManageSettingsPermissionRwd,
    hasManageSettingsPermission,
    userCanManageModel
} from "../helpers";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { compose, ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql";
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

export default {
    typeDefs: /* GraphQL */ `
        type CmsContentModelGroup {
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

        extend type CmsQuery {
            getContentModelGroup(id: ID, where: JSON, sort: String): CmsContentModelGroupResponse

            listContentModelGroups(
                where: JSON
                sort: JSON
                search: CmsSearchInput
                limit: Int
                after: String
                before: String
            ): CmsContentModelGroupListResponse
        }

        extend type CmsMutation {
            createContentModelGroup(data: CmsContentModelGroupInput!): CmsContentModelGroupResponse

            updateContentModelGroup(
                id: ID!
                data: CmsContentModelGroupInput!
            ): CmsContentModelGroupResponse

            deleteContentModelGroup(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
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
        CmsMutation: {
            createContentModelGroup: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateContentModelGroupArgsType, context: CmsContext) => {
                const identity = context.security.getIdentity();

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.displayName
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
    }
};
