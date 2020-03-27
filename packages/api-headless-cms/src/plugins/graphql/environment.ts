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
        type CmsEnvironmentUrl {
            manage: String
            read: String
            preview: String
        }

        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            description: String
            default: Boolean
            setAsDefaultOn: DateTime
            url: CmsEnvironmentUrl
        }

        input CmsEnvironmentInput {
            name: String
            slug: String
            description: String
            default: Boolean
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
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: CmsSearchInput
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
            getEnvironment: resolveGet(environmentFetcher),
            listEnvironments: resolveList(environmentFetcher)
        },
        CmsMutation: {
            createEnvironment: resolveCreate(environmentFetcher),
            updateEnvironment: resolveUpdate(environmentFetcher),
            deleteEnvironment: resolveDelete(environmentFetcher)
        }
    },
    security: {
        shield: {
            CmsQuery: {
                getEnvironment: hasScope("cms:environment:crud"),
                listEnvironments: hasScope("cms:environment:crud")
            },
            CmsMutation: {
                createEnvironment: hasScope("cms:environment:crud"),
                updateEnvironment: hasScope("cms:environment:crud"),
                deleteEnvironment: hasScope("cms:environment:crud")
            }
        }
    }
};
