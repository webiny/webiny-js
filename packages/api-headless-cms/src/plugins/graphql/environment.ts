// @ts-nocheck
import { hasCmsPermission } from "@webiny/api-security";

const checkEnvironmentSettingUpdatePermission = async ({ permission }) => {
    let allowed = false;

    if (permission.manageEnvironments) {
        allowed = true;
    }

    return allowed;
};

const checkEnvironmentSettingListPermission = async () => {
    return true;
};

const environmentFetcher = ctx => ctx.models.CmsEnvironment;

export default {
    typeDefs: /* GraphQL */ `
        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            name: String
            description: String
            createdFrom: CmsEnvironment
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
            getEnvironment: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentSettingListPermission
            )(resolveGet(environmentFetcher)),
            listEnvironments: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentSettingListPermission
            )(resolveList(environmentFetcher))
        },
        CmsMutation: {
            createEnvironment: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentSettingUpdatePermission
            )(resolveCreate(environmentFetcher)),
            updateEnvironment: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentSettingUpdatePermission
            )(resolveUpdate(environmentFetcher)),
            deleteEnvironment: hasCmsPermission(
                "cms.manage.setting",
                checkEnvironmentSettingUpdatePermission
            )(resolveDelete(environmentFetcher))
        }
    }
};
