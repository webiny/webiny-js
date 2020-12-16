import { NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import {
    CmsContext,
    CmsEnvironmentCreateInputType,
    CmsEnvironmentType,
    CmsEnvironmentUpdateInputType
} from "../../types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import {
    getCmsManageSettingsPermission,
    hasManageSettingsPermission,
    hasCmsManageSettingsPermissionRwd,
    userCanManageModel
} from "../../utils";

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
            getEnvironment(id: ID): CmsEnvironmentResponse

            listEnvironments: CmsEnvironmentListResponse
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
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentArgsType, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id } = args;

                const model = await context.cms.environments.get(id);
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
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const environments = await context.cms.environments.list();
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
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentArgsType, context: CmsContext) => {
                const identity = context.security.getIdentity();

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                try {
                    const model = await context.cms.environments.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "CREATE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateEnvironment: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentArgsType, context: CmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id, data } = args;

                const model = await context.cms.environments.get(id);
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
                    const changedModel = await context.cms.environments.update(id, data, model);
                    return new Response({ ...model, ...changedModel });
                } catch (ex) {
                    return new ErrorResponse({
                        code: "UPDATE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteEnvironment: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentArgsType, context: CmsContext) => {
                const { id } = args;
                const permission = await getCmsManageSettingsPermission(context);

                const model = await context.cms.environments.get(id);
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
                    await context.cms.environments.delete(id);
                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "DELETE_ENVIRONMENT_FAILED",
                        message: ex.message
                    });
                }
            })
        },
        CmsEnvironment: {
            isProduction: async (environment: CmsEnvironmentType) => {
                if (!environment.aliases || environment.aliases.length === 0) {
                    return false;
                }

                return environment.aliases.some(alias => !!alias.isProduction);
            }
        }
    }
};
