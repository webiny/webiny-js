// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const I18NLocaleFetcher = ({ getEntity }) => getEntity("I18NLocale");

export default {
    typeDefs: () => [
        `
        type I18NLocale {
            id: ID
            code: String
            default: Boolean
            createdOn: DateTime
        }
        
        input I18NLocaleInput {
            id: ID
            code: String
            default: Boolean
            createdOn: DateTime
        }
        
        type I18NLocaleResponse {
            data: I18NLocale
            error: Error
        }
        
        type I18NLocaleListResponse {
            data: [I18NLocale]
            meta: ListMeta
            error: Error
        }
    `
    ],
    typeExtensions: `
        extend type I18NQuery {
            getI18NLocale(
                id: ID 
            ): I18NLocaleResponse
            
            listI18NLocales(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): I18NLocaleListResponse
        }
        
        extend type I18NMutation {
            createI18NLocale(
                data: I18NLocaleInput!
            ): I18NLocaleResponse
            
            updateI18NLocale(
                id: ID!
                data: I18NLocaleInput!
            ): I18NLocaleResponse
        
            deleteI18NLocale(
                id: ID!
            ): DeleteResponse
        }
    `,
    resolvers: {
        I18NQuery: {
            getI18NLocale: resolveGet(I18NLocaleFetcher),
            listI18NLocales: resolveList(I18NLocaleFetcher)
        },
        I18NMutation: {
            createI18NLocale: resolveCreate(I18NLocaleFetcher),
            updateI18NLocale: resolveUpdate(I18NLocaleFetcher),
            deleteI18NLocale: resolveDelete(I18NLocaleFetcher)
        }
    }
};
