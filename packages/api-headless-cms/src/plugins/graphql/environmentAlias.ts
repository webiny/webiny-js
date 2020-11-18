// @ts-nocheck
import { hasCmsPermission } from "@webiny/api-security";

const checkEnvironmentAliasSettingUpdatePermission = async ({ permission }) => {
    let allowed = false;

    if (permission.manageAliases) {
        allowed = true;
    }

    return allowed;
};

const checkEnvironmentAliasSettingListPermission = async () => {
    return true;
};

const environmentAliasFetcher = ctx => ctx.models.CmsEnvironmentAlias;

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
            getEnvironmentAlias: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentAliasSettingListPermission
            )(resolveGet(environmentAliasFetcher)),
            listEnvironmentAliases: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentAliasSettingListPermission
            )(resolveList(environmentAliasFetcher))
        },
        CmsMutation: {
            createEnvironmentAlias: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentAliasSettingUpdatePermission
            )(resolveCreate(environmentAliasFetcher)),
            updateEnvironmentAlias: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentAliasSettingUpdatePermission
            )(resolveUpdate(environmentAliasFetcher)),
            deleteEnvironmentAlias: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentAliasSettingUpdatePermission
            )(resolveDelete(environmentAliasFetcher))
        }
    }
};
