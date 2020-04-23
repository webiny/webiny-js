import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

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
            getEnvironmentAlias: resolveGet(environmentAliasFetcher),
            listEnvironmentAliases: resolveList(environmentAliasFetcher)
        },
        CmsMutation: {
            createEnvironmentAlias: resolveCreate(environmentAliasFetcher),
            updateEnvironmentAlias: resolveUpdate(environmentAliasFetcher),
            deleteEnvironmentAlias: resolveDelete(environmentAliasFetcher)
        }
    },
    security: {
        shield: {
            CmsQuery: {
                getEnvironmentAlias: hasScope("cms:environment:alias:crud"),
                listEnvironmentAliases: hasScope("cms:environment:alias:crud")
            },
            CmsMutation: {
                createEnvironmentAlias: hasScope("cms:environment:alias:crud"),
                updateEnvironmentAlias: hasScope("cms:environment:alias:crud"),
                deleteEnvironmentAlias: hasScope("cms:environment:alias:crud")
            }
        }
    }
};
