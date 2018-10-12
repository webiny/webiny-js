// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const apiTokenFetcher = ctx => ctx.security.ApiToken;

export default {
    typeDefs: `
         type ApiToken {
            id: ID
            name: String
            slug: String
            description: String
            createdOn: String
            groups: [Group]
            roles: [Role]
            scopes: [String]
        }
    
        input ApiTokenInput {
            name: String
            slug: String
            description: String
            groups: [String]
            roles: [String]
        }
        
        type ApiTokenListResponse {
            data: [ApiToken]
            meta: ListMeta
            error: Error
        }
        
        type ApiTokenResponse {
            data: Group
            error: Error
        }
    `,
    queryFields: `
        getApiToken(
            id: ID 
            where: JSON
            sort: String
        ): ApiTokenResponse
        
        listApiTokens(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): ApiTokenListResponse
    `,
    mutationFields: `
        createApiToken(
            data: ApiTokenInput!
        ): ApiToken
        
        deleteApiToken(
            id: ID!
        ): Boolean
    `,
    queryResolvers: {
        getGroup: resolveGet(apiTokenFetcher),
        listGroups: resolveList(apiTokenFetcher)
    },
    mutationResolvers: {
        createGroup: resolveCreate(apiTokenFetcher),
        updateGroup: resolveUpdate(apiTokenFetcher),
        deleteGroup: resolveDelete(apiTokenFetcher)
    }
};
