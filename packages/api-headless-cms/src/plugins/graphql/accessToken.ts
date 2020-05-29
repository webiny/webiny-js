import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const AccessTokenFetcher = ctx => ctx.models.CmsAccessToken;

export default {
    typeDefs: /* GraphQL */ `
        type CmsAccessToken {
            id: ID
            name: String
            description: String
            token: String
            createdOn: DateTime
            environments: [CmsEnvironment]
        }

        # Response types
        type CmsAccessTokenResponse {
            data: CmsAccessToken
            error: CmsError
        }

        type CmsAccessTokenListResponse {
            data: [CmsAccessToken]
            meta: CmsListMeta
            error: CmsError
        }

        input CmsAccessTokenCreateInput {
            name: String
            description: String
            environments: [ID]
        }

        input CmsAccessTokenUpdateInput {
            name: String
            description: String
            environments: [ID]
        }

        extend type CmsQuery {
            getAccessToken(id: ID, where: JSON, sort: String): CmsAccessTokenResponse

            listAccessTokens(
                where: JSON
                sort: JSON
                limit: Int
                after: String
                before: String
            ): CmsAccessTokenListResponse
        }

        extend type CmsMutation {
            createAccessToken(data: CmsAccessTokenCreateInput!): CmsAccessTokenResponse

            updateAccessToken(id: ID!, data: CmsAccessTokenUpdateInput!): CmsAccessTokenResponse

            deleteAccessToken(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getAccessToken: hasScope("cms:access-token:crud")(resolveGet(AccessTokenFetcher)),
            listAccessTokens: hasScope("cms:access-token:crud")(resolveList(AccessTokenFetcher))
        },
        CmsMutation: {
            createAccessToken: hasScope("cms:access-token:crud")(
                resolveCreate(AccessTokenFetcher)
            ),
            updateAccessToken: hasScope("cms:access-token:crud")(
                resolveUpdate(AccessTokenFetcher)
            ),
            deleteAccessToken: hasScope("cms:access-token:crud")(resolveDelete(AccessTokenFetcher))
        }
    }
};
