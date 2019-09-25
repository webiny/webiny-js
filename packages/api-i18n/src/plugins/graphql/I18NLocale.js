// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/api/graphql/commodo";
import searchLocaleCodes from "./resolvers/searchLocaleCodes";
import getI18NInformation from "./resolvers/getI18NInformation";

const i18NLocaleFetcher = ctx => ctx.models.I18NLocale;

export default {
    typeDefs: `
        input I18NLocaleSearchInput {
            query: String
            fields: [String]
            operator: String
        }
        
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
            error: I18NError
        }
        
        type I18NLocaleListResponse {
            data: [I18NLocale]
            meta: I18NListMeta
            error: I18NError
        }
        
        type SearchLocaleCodesResponse {
            data: [String]
        }
        
        type I18NInformationResponse {
            locales: [I18NLocale],
            currentLocale: I18NLocale
            defaultLocale: I18NLocale 
        }
        
        extend type I18NQuery {
            getI18NLocale(
                id: ID 
            ): I18NLocaleResponse
            
            listI18NLocales(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: I18NLocaleSearchInput
            ): I18NLocaleListResponse   
            
            getI18NInformation: I18NInformationResponse
            
            searchLocaleCodes(
                search: String
            ): SearchLocaleCodesResponse
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
            ): I18NDeleteResponse
        }
    `,
    resolvers: {
        I18NQuery: {
            getI18NLocale: resolveGet(i18NLocaleFetcher),
            listI18NLocales: resolveList(i18NLocaleFetcher),
            searchLocaleCodes,
            getI18NInformation
        },
        I18NMutation: {
            createI18NLocale: resolveCreate(i18NLocaleFetcher),
            updateI18NLocale: resolveUpdate(i18NLocaleFetcher),
            deleteI18NLocale: resolveDelete(i18NLocaleFetcher)
        }
    }
};
