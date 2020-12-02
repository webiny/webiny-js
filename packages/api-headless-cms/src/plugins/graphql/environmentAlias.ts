import { NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import {
    CmsEnvironmentAliasCreateInputType,
    CmsEnvironmentAliasUpdateInputType
} from "@webiny/api-headless-cms/types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsResolverContext,
    getCmsManageSettingsPermission,
    hasEnvironmentPermission,
    hasEnvironmentPermissionRwd,
    userCanManageModel
} from "./helpers";

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
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentAliasArgsType, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id } = args;

                const environmentAliasContext = context.cms.environmentAlias;
                const model = await environmentAliasContext.get(id);
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
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const environmentAliasContext = context.cms.environmentAlias;

                const aliases = await environmentAliasContext.list();
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
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentAliasArgsType, context: CmsResolverContext) => {
                const identity = context.security.getIdentity();
                const environmentAliasContext = context.cms.environmentAlias;

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.displayName
                };
                try {
                    const model = await environmentAliasContext.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                        message: ex.message
                    });
                }
            }),
            updateEnvironmentAlias: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentAliasArgsType, context: CmsResolverContext) => {
                const permission = await getCmsManageSettingsPermission(context);

                const { id, data } = args;

                const environmentAliasContext = context.cms.environmentAlias;

                const model = await environmentAliasContext.get(id);
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
                    const changedModel = await environmentAliasContext.update(id, data);
                    return new Response({ ...model, ...changedModel });
                } catch (ex) {
                    return new ErrorResponse({
                        code: "UPDATE_ENVIRONMENT_ALIAS_FAILED",
                        message: ex.message
                    });
                }
            }),
            deleteEnvironmentAlias: compose(
                hasEnvironmentPermission(),
                hasEnvironmentPermissionRwd("d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentAliasArgsType, context: CmsResolverContext) => {
                const { id } = args;
                const permission = await getCmsManageSettingsPermission(context);

                const environmentAliasContext = context.cms.environmentAlias;

                const model = await environmentAliasContext.get(id);
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
                    await environmentAliasContext.delete(model);
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
