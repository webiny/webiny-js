import { hasScope } from "@webiny/api-security";
import searchLocaleCodes from "./resolvers/searchLocaleCodes";
import getI18NInformation from "./resolvers/getI18NInformation";
import { LocaleData, PK_LOCALE } from "../models/localeData.model";
import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql";

export default {
    typeDefs: `
        input I18NLocaleSearchInput {
            query: String
            fields: [String]
            operator: String
        }
        
        type I18NLocale {
            code: String
            default: Boolean
            createdOn: DateTime
        }
        
        input I18NLocaleInput {
            code: String
            default: Boolean
            createdOn: DateTime
        }
        
        input ListI18NLocalesWhereInput {
            codeBeginsWith: String
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
            locales: [I18NLocale]
            currentLocale: I18NLocale
            defaultLocale: I18NLocale 
        }
        
        extend type I18NQuery {
            getI18NLocale(
                code: String! 
            ): I18NLocaleResponse
            
            listI18NLocales(
                where: ListI18NLocalesWhereInput
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
                code: String!
                data: I18NLocaleInput!
            ): I18NLocaleResponse
        
            deleteI18NLocale(
                code: String!
            ): I18NLocaleResponse
        }
    `,
    resolvers: {
        I18NQuery: {
            getI18NLocale: hasScope("i18n:locale:crud")(async (_, args, context) => {
                const { I18N } = context.models;
                const locale = await I18N.findOne({
                    query: { PK: PK_LOCALE, SK: args.code }
                });
                if (!locale) {
                    return new NotFoundResponse(`Locale "${args.code}" not found.`);
                }

                return new Response(locale.data);
            }),
            listI18NLocales: hasScope("i18n:locale:crud")(async (_, args, context) => {
                const { I18N } = context.models;

                const query = { PK: PK_LOCALE, SK: null };
                if (typeof args?.where?.codeBeginsWith === "string") {
                    query.SK = { $beginsWith: args.where.codeBeginsWith };
                } else {
                    query.SK = { $gt: " " };
                }

                const locales = await I18N.find({ query });
                return new Response(locales.map(item => item.data));
            }),
            searchLocaleCodes,
            getI18NInformation
        },
        I18NMutation: {
            createI18NLocale: hasScope("i18n:locale:crud")(async (_, args, context) => {
                const { I18N } = context.models;
                const { data } = args;

                try {
                    const locale = new I18N();
                    locale.PK = PK_LOCALE;
                    locale.SK = data.code;
                    locale.data = new LocaleData().populate({
                        default: data.default,
                        code: data.code
                    });

                    await locale.save();
                    return new Response(locale.data);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }),
            updateI18NLocale: hasScope("i18n:locale:crud")(async (_, args, context) => {
                const { I18N } = context.models;
                try {
                    const locale = await I18N.findOne({
                        query: { PK: PK_LOCALE, SK: args.code }
                    });
                    if (!locale) {
                        return new NotFoundResponse(`Locale "${args.code}" not found.`);
                    }
                    locale.data.populate(args.data);
                    await locale.save();
                    return new Response(locale.data);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }),
            deleteI18NLocale: hasScope("i18n:locale:crud")(async (_, args, context) => {
                const { I18N } = context.models;
                try {
                    const locale = await I18N.findOne({
                        query: { PK: PK_LOCALE, SK: args.code }
                    });
                    if (!locale) {
                        return new NotFoundResponse(`Locale "${args.code}" not found.`);
                    }

                    await locale.delete();
                    return new Response(locale.data);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            })
        }
    }
};
