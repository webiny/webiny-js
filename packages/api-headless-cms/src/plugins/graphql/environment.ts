import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const environmentFetcher = ctx => ctx.models.CmsEnvironment;

export default {
    typeDefs: /* GraphQL */ `
        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            name: String
            description: String
            createdFrom: CmsEnvironment
            environmentAlias: CmsEnvironmentAlias
            contentModels: [CmsContentModel]
            isProduction: Boolean
            slug: String
        }

        type CmsContentModel {
            modelId: String
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
            getEnvironment: hasScope("cms:environment:crud")(resolveGet(environmentFetcher)),
            listEnvironments: hasScope("cms:environment:crud")(resolveList(environmentFetcher))
        },
        CmsMutation: {
            createEnvironment: hasScope("cms:environment:crud")(resolveCreate(environmentFetcher)),
            updateEnvironment: hasScope("cms:environment:crud")(resolveUpdate(environmentFetcher)),
            deleteEnvironment: hasScope("cms:environment:crud")(resolveDelete(environmentFetcher))
        }
    }
};
