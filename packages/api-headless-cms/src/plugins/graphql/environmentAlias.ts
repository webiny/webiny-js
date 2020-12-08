import { NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import {
    CmsEnvironmentAliasCreateInputType,
    CmsEnvironmentAliasUpdateInputType,
    HeadlessCmsContext
} from "../../types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import {
    getCmsManageSettingsPermission,
    hasManageSettingsPermission,
    hasCmsManageSettingsPermissionRwd,
    userCanManageModel
} from "../../common/helpers";

type CreateEnvironmentAliasArgsType = {
    data: CmsEnvironmentAliasCreateInputType;
};
type ReadEnvironmentAliasArgsType = {
    id: string;
};
type UpdateEnvironmentAliasArgsType = ReadEnvironmentAliasArgsType & {
    data: CmsEnvironmentAliasUpdateInputType;
};
type DeleteEnvironmentAliasArgsType = {
    id: string;
};

export default {
    typeDefs: /* GraphQL */ `
        type CmsEnvironmentAliasUrl {
            manage: String
            read: String
            preview: String
        }

        type CmsEnvironmentAlias {
            id: ID
            createdOn: DateTime
            changedOn: DateTime
            name: String
            slug: String
            description: String
            url: CmsEnvironmentAliasUrl
            environment: CmsEnvironment
            isProduction: Boolean
            createdBy: JSON
        }

        input CmsEnvironmentAliasInput {
            name: String
            slug: String
            description: String
            environment: ID
        }

        # Response types
        type CmsEnvironmentAliasResponse {
            data: CmsEnvironmentAlias
            error: CmsError
        }

        type CmsEnvironmentAliasListResponse {
            data: [CmsEnvironmentAlias]
            meta: CmsListMeta
            error: CmsError
        }

        extend type CmsQuery {
            getEnvironmentAlias(id: ID, where: JSON, sort: String): CmsEnvironmentAliasResponse

            listEnvironmentAliases(
                where: JSON
                sort: JSON
                search: CmsSearchInput
                limit: Int
                after: String
                before: String
            ): CmsEnvironmentAliasListResponse
        }

        extend type CmsMutation {
            createEnvironmentAlias(data: CmsEnvironmentAliasInput!): CmsEnvironmentAliasResponse

            updateEnvironmentAlias(
                id: ID!
                data: CmsEnvironmentAliasInput!
            ): CmsEnvironmentAliasResponse

            deleteEnvironmentAlias(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getEnvironmentAlias: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentAliasArgsType, context: HeadlessCmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id } = args;

                const model = await context.crud.environmentAlias.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                return new Response(model);
            }),
            listEnvironmentAliases: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: HeadlessCmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const aliases = await context.crud.environmentAlias.list();
                if (permission.own === true) {
                    const identity = context.security.getIdentity();
                    return new Response(
                        aliases.filter(model => userCanManageModel(identity, model))
                    );
                }
                return new Response(aliases);
            })
        },
        CmsMutation: {
            createEnvironmentAlias: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentAliasArgsType, context: HeadlessCmsContext) => {
                const identity = context.security.getIdentity();

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.displayName
                };
                try {
                    const model = await context.crud.environmentAlias.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateEnvironmentAlias: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentAliasArgsType, context: HeadlessCmsContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id, data } = args;

                const model = await context.crud.environmentAlias.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    const changedModel = await context.crud.environmentAlias.update(id, data);
                    return new Response({ ...model, ...changedModel });
                } catch (ex) {
                    return new ErrorResponse({
                        code: "UPDATE_ENVIRONMENT_ALIAS_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteEnvironmentAlias: compose(
                hasManageSettingsPermission(),
                hasCmsManageSettingsPermissionRwd("d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentAliasArgsType, context: HeadlessCmsContext) => {
                const { id } = args;
                const permission = await getCmsManageSettingsPermission(context);

                const model = await context.crud.environmentAlias.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManageModel(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    await context.crud.environmentAlias.delete(model);
                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "DELETE_ENVIRONMENT_ALIAS_FAILED",
                        message: ex.message
                    });
                }
            })
        }
    }
};
