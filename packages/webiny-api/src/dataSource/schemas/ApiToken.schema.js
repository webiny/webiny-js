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
            token: String
            description: String
            createdOn: String
            groups: [Group]
            roles: [Role]
            scopes: [String]
        }
    
        input ApiTokenInput {
            name: String
            description: String
            groups: [ID]
            roles: [ID]
        }
        
        type ApiTokenListResponse {
            data: [ApiToken]
            meta: ListMeta
            error: Error
        }
        
        type ApiTokenResponse {
            data: ApiToken
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
        ): ApiTokenResponse
        
        updateApiToken(
            id: ID!
            data: ApiTokenInput!
        ): ApiTokenResponse
        
        deleteApiToken(
            id: ID!
        ): DeleteResponse
    `,
    queryResolvers: {
        getApiToken: resolveGet(apiTokenFetcher),
        listApiTokens: resolveList(apiTokenFetcher)
    },
    mutationResolvers: {
        createApiToken: async (...args: Array<any>) => {
            const res = await resolveCreate(apiTokenFetcher)(...args);
            await res.data.generateJWT();
            return res;
        },
        updateApiToken: resolveUpdate(apiTokenFetcher),
        deleteApiToken: resolveDelete(apiTokenFetcher)
    }
};
