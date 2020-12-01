import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Context as HandlerContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import {
    CmsContextType,
    CmsEnvironmentAliasCreateInputType,
    CmsEnvironmentAliasType,
    CmsEnvironmentAliasUpdateInputType
} from "@webiny/api-headless-cms/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";

type ResolverContext = HandlerContext<I18NContext, SecurityContext, CmsContextType>;
type CRUDType = "r" | "w" | "d";
type HasRwdCallableArgsType = {
    permission?: {
        rwd?: CRUDType;
    };
    rwd: CRUDType;
};
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

const CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME = "cms.manage.setting";

const hasRwd = ({ permission, rwd }: HasRwdCallableArgsType) => {
    if (!permission || !permission.rwd) {
        return false;
    } else if (typeof permission.rwd !== "string") {
        return true;
    }
    return permission.rwd.includes(rwd);
};
const hasPermissionRwd = (rwd: CRUDType) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            const permission = await context.security.getPermission(
                CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME
            );
            if (!permission || !hasRwd({ permission, rwd })) {
                return new NotAuthorizedResponse();
            }
            return resolver(parent, args, context, info);
        };
    };
};

const userCanManage = (
    identity: SecurityIdentity,
    { createdBy }: CmsEnvironmentAliasType
): boolean => {
    if (!createdBy) {
        return false;
    }
    return createdBy.id === identity.id;
};

const getEnvironmentAliasPermission = async (context: ResolverContext) => {
    return await context.security.getPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME);
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
            name: String
            slug: String
            description: String
            url: CmsEnvironmentAliasUrl
            environment: CmsEnvironment
            isProduction: Boolean
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
                hasPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME),
                hasPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentAliasArgsType, context: ResolverContext) => {
                const permission = await getEnvironmentAliasPermission(context);

                const { id } = args;

                const environmentAliasContext = context.cms.environmentAlias;
                const model = await environmentAliasContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                return new Response(model);
            }),
            listEnvironmentAliases: compose(
                hasPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME),
                hasPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: ResolverContext) => {
                const permission = await getEnvironmentAliasPermission(context);

                const environmentAliasContext = context.cms.environmentAlias;

                const aliases = await environmentAliasContext.list();
                if (permission.own === true) {
                    const identity = context.security.getIdentity();
                    return new Response(aliases.filter(model => userCanManage(identity, model)));
                }
                return new Response(aliases);
            })
        },
        CmsMutation: {
            createEnvironmentAlias: compose(
                hasPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME),
                hasPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentAliasArgsType, context: ResolverContext) => {
                const identity = context.security.getIdentity();
                const environmentAliasContext = context.cms.environmentAlias;

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    name: identity.name
                };
                try {
                    return new Response(await environmentAliasContext.create(data, createdBy));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            updateEnvironmentAlias: compose(
                hasPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME),
                hasPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentAliasArgsType, context: ResolverContext) => {
                const permission = await getEnvironmentAliasPermission(context);

                const { id, data } = args;

                const environmentAliasContext = context.cms.environmentAlias;

                const model = await environmentAliasContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    const changedModel = await environmentAliasContext.update(id, data);
                    return new Response({ ...model, ...changedModel });
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            deleteEnvironmentAlias: compose(
                hasPermission(CMS_ENVIRONMENT_ALIAS_PERMISSION_NAME),
                hasPermissionRwd("d"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentAliasArgsType, context: ResolverContext) => {
                const { id } = args;
                const permission = await getEnvironmentAliasPermission(context);

                const environmentAliasContext = context.cms.environmentAlias;

                const model = await environmentAliasContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS EnvironmentAlias "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getIdentity(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                await environmentAliasContext.delete(model);

                return new Response(model);
            })
        }
    }
};
