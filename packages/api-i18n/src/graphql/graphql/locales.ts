import {
    Response,
    ErrorResponse,
    NotFoundResponse,
    ListResponse
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { I18NContext } from "~/types";
import searchLocaleCodes from "./resolvers/searchLocaleCodes";
import getI18NInformation from "./resolvers/getI18NInformation";
import NotAuthorizedResponse from "@webiny/api-security/NotAuthorizedResponse";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";

const resolve = async (fn: () => any): Promise<Response | ErrorResponse> => {
    try {
        return new Response(await fn());
    } catch (ex) {
        if (ex instanceof NotFoundError) {
            return new NotFoundResponse(ex.message);
        } else if (ex instanceof NotAuthorizedError) {
            return new NotAuthorizedResponse({
                code: ex.code,
                message: ex.message,
                data: ex.data || null
            });
        }
        return new ErrorResponse(ex);
    }
};

export const createLocalesGraphQL = (): GraphQLSchemaPlugin<I18NContext> => {
    return {
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

                input I18NListLocalesWhere {
                    code: String
                    code_in: [String!]
                    code_not_in: [String!]
                    code_not: String
                    default: Boolean
                    createdBy: String
                    createdOn: String
                    createdOn_not: String
                    createdOn_not_in: [String!]
                    createdOn_lt: String
                    createdOn_lte: String
                    createdOn_gt: String
                    createdOn_gte: String
                }

                enum I18NListLocalesSorter {
                    code_ASC
                    code_DESC
                    createdOn_ASC
                    createdOn_DESC
                    createdBy_ASC
                    createdBy_DESC
                }

                extend type I18NQuery {
                    getI18NLocale(code: String!): I18NLocaleResponse
                    listI18NLocales(
                        where: I18NListLocalesWhere
                        sort: I18NListLocalesSorter
                        limit: Int
                    ): I18NLocaleListResponse
                    getI18NInformation: I18NInformationResponse
                    searchLocaleCodes(search: String): SearchLocaleCodesResponse
                }

                extend type I18NMutation {
                    createI18NLocale(data: I18NLocaleInput!): I18NLocaleResponse
                    updateI18NLocale(
                        code: String!
                        data: I18NLocaleUpdateInput!
                    ): I18NLocaleResponse
                    deleteI18NLocale(code: String!): I18NLocaleResponse
                }
            `,
            resolvers: {
                I18NQuery: {
                    getI18NLocale: async (_, args: any, context) => {
                        return resolve(() => context.i18n.locales.getLocale(args.code));
                    },
                    listI18NLocales: async (_, args: any, context) => {
                        try {
                            const [items, meta] = await context.i18n.locales.listLocales(args);
                            return new ListResponse(items, meta);
                        } catch (ex) {
                            return new ErrorResponse(ex);
                        }
                    },
                    searchLocaleCodes,
                    getI18NInformation
                },
                I18NMutation: {
                    createI18NLocale: async (_, args: any, context) => {
                        return resolve(() => context.i18n.locales.createLocale(args.data));
                    },
                    updateI18NLocale: async (_, args: any, context) => {
                        return resolve(() =>
                            context.i18n.locales.updateLocale(args.code, args.data)
                        );
                    },
                    deleteI18NLocale: async (_, args: any, context) => {
                        return resolve(() => context.i18n.locales.deleteLocale(args.code));
                    }
                }
            }
        }
    };
};
