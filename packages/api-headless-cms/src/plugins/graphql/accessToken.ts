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
            scopes: [String]
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
            scopes: [String]
        }

        input CmsAccessTokenUpdateInput {
            name: String
            description: String
            environments: [ID]
            scopes: [String]
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
            getAccessToken: hasScope("cms:access-token:get")(resolveGet(AccessTokenFetcher)),
            listAccessTokens: hasScope("cms:access-token:list")(resolveList(AccessTokenFetcher))
        },
        CmsMutation: {
            createAccessToken: hasScope("cms:access-token:create")(
                resolveCreate(AccessTokenFetcher)
            ),
            updateAccessToken: hasScope("cms:access-token:update")(
                resolveUpdate(AccessTokenFetcher)
            ),
            deleteAccessToken: hasScope("cms:access-token:delete")(
                resolveDelete(AccessTokenFetcher)
            )
        }
    }
};
