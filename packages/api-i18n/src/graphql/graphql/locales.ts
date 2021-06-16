import { Response, ErrorResponse, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "~/types";
import searchLocaleCodes from "./resolvers/searchLocaleCodes";
import getI18NInformation from "./resolvers/getI18NInformation";
import NotAuthorizedResponse from "@webiny/api-security/NotAuthorizedResponse";

const plugin: GraphQLSchemaPlugin<I18NContext & SecurityContext> = {
    type: "graphql-schema",
    name: "graphql-schema-i18n-locales",
    schema: {
        typeDefs: /* GraphQL */ `
            type I18NCreatedBy {
                id: ID
                displayName: String
                type: String
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
            }

            input I18NLocaleUpdateInput {
                default: Boolean!
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
                updateI18NLocale(code: String!, data: I18NLocaleUpdateInput!): I18NLocaleResponse
                deleteI18NLocale(code: String!): I18NLocaleResponse
            }
        `,
        resolvers: {
            I18NQuery: {
                getI18NLocale: async (_, args: { code: string }, context) => {
                    const { i18n, security } = context;

                    const permission = await security.getPermission("i18n.locale");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    const locale = await i18n.locales.getByCode(args.code);
                    if (!locale) {
                        return new NotFoundResponse(`Locale "${args.code}" not found.`);
                    }

                    return new Response(locale);
                },
                listI18NLocales: async (_, args, context) => {
                    const { i18n, security } = context;
                    const permission = await security.getPermission("i18n.locale");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
                    return new Response(await i18n.locales.list());
                },
                searchLocaleCodes,
                getI18NInformation
            },
            I18NMutation: {
                createI18NLocale: async (_, args: { data: Record<string, any> }, context) => {
                    const { i18n, security } = context;
                    const { data } = args;

                    const permission = await security.getPermission("i18n.locale");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    if (await i18n.locales.getByCode(data.code)) {
                        return new NotFoundResponse(
                            `Locale with key "${data.code}" already exists.`
                        );
                    }

                    await i18n.locales.create(data);
                    if (data.default) {
                        await i18n.locales.updateDefault(data.code);
                    }
                    const locale = await i18n.locales.getByCode(data.code);
                    return new Response(locale);
                },
                updateI18NLocale: async (
                    _,
                    args: { code: string; data: { default: boolean } },
                    context
                ) => {
                    const { i18n, security } = context;
                    const { code, data } = args;

                    const permission = await security.getPermission("i18n.locale");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    const locale = await i18n.locales.getByCode(code);
                    if (!locale) {
                        return new NotFoundResponse(`Locale "${args.code}" not found.`);
                    }

                    if (locale.default && !data.default) {
                        return new ErrorResponse({
                            message:
                                "Cannot unset default locale, please set another locale as default first."
                        });
                    }

                    await i18n.locales.update(code, data);

                    if (data.default) {
                        await i18n.locales.updateDefault(code);
                    }
                    const updatedLocale = await i18n.locales.getByCode(code);
                    return new Response(updatedLocale);
                },
                deleteI18NLocale: async (_, args: { code: string }, context) => {
                    const { i18n, security } = context;
                    const { code } = args;

                    const permission = await security.getPermission("i18n.locale");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    const locale = await i18n.locales.getByCode(code);
                    if (!locale) {
                        return new NotFoundResponse(`Locale "${args.code}" not found.`);
                    }

                    if (locale.default) {
                        return new ErrorResponse({
                            message:
                                "Cannot delete default locale, please set another locale as default first."
                        });
                    }

                    const allLocales = await i18n.locales.list();
                    if (allLocales.length === 1) {
                        return new ErrorResponse({
                            message: "Cannot delete the last locale."
                        });
                    }

                    await i18n.locales.delete(code);

                    return new Response(locale);
                }
            }
        }
    }
};

export default plugin;
