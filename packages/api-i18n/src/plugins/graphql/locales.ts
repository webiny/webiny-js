import { hasScope } from "@webiny/api-security";
import searchLocaleCodes from "./resolvers/searchLocaleCodes";
import getI18NInformation from "./resolvers/getI18NInformation";
import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql/responses";

export default {
    typeDefs: /* GraphQL */ `
        type I18NCreatedBy {
            id: ID
            displayName: String
        }

        type I18NLocale {
            code: String
            default: Boolean
            createdOn: DateTime
            createdBy: I18NCreatedBy
        }

        input I18NLocaleInput {
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

        type I18NInformationLocale {
            code: String
            default: Boolean
        }

        type I18NInformationCurrentLocale {
            context: String
            locale: String
        }

        type I18NInformationResponse {
            locales: [I18NInformationLocale]
            currentLocales: [I18NInformationCurrentLocale]
            defaultLocale: I18NInformationLocale
        }

        extend type I18NQuery {
            getI18NLocale(code: String!): I18NLocaleResponse
            listI18NLocales: I18NLocaleListResponse
            getI18NInformation: I18NInformationResponse
            searchLocaleCodes(search: String): SearchLocaleCodesResponse
        }

        extend type I18NMutation {
            createI18NLocale(data: I18NLocaleInput!): I18NLocaleResponse
            updateI18NLocale(code: String!, data: I18NLocaleInput!): I18NLocaleResponse
            deleteI18NLocale(code: String!): I18NLocaleResponse
        }
    `,
    resolvers: {
        I18NQuery: {
            getI18NLocale: hasScope("i18n.locale")(async (_, args, context) => {
                const { locales } = context;
                const locale = await locales.getByCode(args.code);
                if (!locale) {
                    return new NotFoundResponse(`Locale "${args.code}" not found.`);
                }

                return new Response(locale);
            }),
            listI18NLocales: hasScope("i18n.locale")(async (_, args, context) => {
                const { locales } = context;
                return new Response(await locales.list());
            }),
            searchLocaleCodes,
            getI18NInformation
        },
        I18NMutation: {
            createI18NLocale: hasScope("i18n.locale")(async (_, args, context) => {
                const { locales } = context;
                const { data } = args;

                if (await locales.getByCode(data.code)) {
                    return new NotFoundResponse(`Locale with key "${data.code}" already exists.`);
                }

                await locales.create(data);
                if (data.default) {
                    await locales.updateDefault(data.code);
                }

                return new Response(data);
            }),
            updateI18NLocale: hasScope("i18n.locale")(async (_, args, context) => {
                const { locales } = context;
                const { code } = args;

                const locale = await locales.getByCode(code);
                if (!locale) {
                    return new NotFoundResponse(`Locale "${args.code}" not found.`);
                }

                await locales.update(code, {
                    default: args.default
                });

                if (locale.default) {
                    await locales.updateDefault(code);
                }

                return new Response(locale);
            }),
            deleteI18NLocale: hasScope("i18n.locale")(async (_, args, context) => {
                const { locales } = context;
                const { code } = args;

                const locale = await locales.getByCode(code);
                if (!locale) {
                    return new NotFoundResponse(`Locale "${args.code}" not found.`);
                }

                if (locale.default) {
                    return new ErrorResponse({
                        message:
                            "Cannot delete default locale, please set another locale as default first."
                    });
                }

                const allLocales = await locales.list();
                if (allLocales.length === 1) {
                    return new ErrorResponse({
                        message: "Cannot delete the last locale."
                    });
                }

                await locales.delete(code);

                return new Response(locale);
            })
        }
    }
};
