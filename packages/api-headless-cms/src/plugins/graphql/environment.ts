import { NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import {
    CmsEnvironmentCreateInputType,
    CmsEnvironmentUpdateInputType
} from "@webiny/api-headless-cms/types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsResolverContext,
    getCmsManageSettingsPermission,
    hasEnvironmentPermission,
    hasEnvironmentPermissionRwd,
    userCanManageModel
} from "./helpers";

type CreateEnvironmentArgsType = {
    data: CmsEnvironmentCreateInputType;
};
type ReadEnvironmentArgsType = {
    id: string;
};
type UpdateEnvironmentArgsType = ReadEnvironmentArgsType & {
    data: CmsEnvironmentUpdateInputType;
};
type DeleteEnvironmentArgsType = {
    id: string;
};

export default {
    typeDefs: /* GraphQL */ `
        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            changedOn: DateTime
            name: String
            description: String
            createdFrom: CmsEnvironment
            createdBy: JSON
            environmentAliases: [CmsEnvironmentAlias]
            contentModels: [CmsContentModel]
            isProduction: Boolean
            slug: String
        }

        type CmsContentModel {
            id: ID
            modelId: String
            name: String
        }

        input CmsEnvironmentInput {
            name: String
            description: String
            slug: String
            createdFrom: ID
        }

        # Response types
        type CmsEnvironmentResponse {
            data: CmsEnvironment
            error: CmsError
        }

        type CmsEnvironmentListResponse {
            data: [CmsEnvironment]
            meta: CmsListMeta
            error: CmsError
        }

        extend type CmsQuery {
            getEnvironment(id: ID, where: JSON, sort: String): CmsEnvironmentResponse

            listEnvironments(
                where: JSON
                sort: JSON
                search: CmsSearchInput
                limit: Int
                after: String
                before: String
            ): CmsEnvironmentListResponse
        }

        extend type CmsMutation {
            createEnvironment(data: CmsEnvironmentInput!): CmsEnvironmentResponse

            updateEnvironment(id: ID!, data: CmsEnvironmentInput!): CmsEnvironmentResponse

            deleteEnvironment(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getEnvironment: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentArgsType, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id } = args;

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                return new Response(model);
            }),
            listEnvironments: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const environmentContext = context.cms.environment;

                const environments = await environmentContext.list();
                if (permission.own === true) {
                    const identity = context.security.getIdentity();
                    return new Response(
                        environments.filter(model => userCanManageModel(identity, model))
                    );
                }
                return new Response(environments);
            })
        },
        CmsMutation: {
            createEnvironment: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentArgsType, context: CmsResolverContext) => {
                const identity = context.security.getIdentity();
                const environmentContext = context.cms.environment;

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.displayName
                };

                try {
                    const model = await environmentContext.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "CREATE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateEnvironment: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentArgsType, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id, data } = args;

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    const changedModel = await environmentContext.update(id, data, model);
                    return new Response({ ...model, ...changedModel });
                } catch (ex) {
                    return new ErrorResponse({
                        code: "UPDATE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteEnvironment: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentArgsType, context: CmsResolverContext) => {
                const { id } = args;
                const permission = await getCmsManageSettingsPermission(context);

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    await environmentContext.delete(id);
                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "DELETE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            })
        }
    }
};
