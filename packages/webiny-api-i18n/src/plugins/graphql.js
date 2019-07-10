// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver } from "webiny-api/graphql";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-api-security";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const I18NLocaleFetcher = ({ getEntity }) => getEntity("I18NLocale");

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-i18n",
        schema: {
            namespace: "i18n",
            typeDefs: gql`
                extend type Query {
                    i18n: I18NQuery
                }

                extend type Mutation {
                    i18n: I18NMutation
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
                }

                type I18NLocaleListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
                }

                type I18NLocaleError {
                    code: String
                    message: String
                    data: JSON
                }

                type I18NLocaleDeleteResponse {
                    data: Boolean
                    error: I18NLocaleError
                }

                type I18NLocaleListResponse {
                    data: [I18NLocale]
                    meta: I18NLocaleListMeta
                    error: I18NLocaleError
                }

                input I18NLocaleSearchInput {
                    query: String
                    fields: [String]
                    operator: String
                }

                type I18NQuery {
                    getI18NLocale(id: ID): I18NLocaleResponse

                    listI18NLocales(
                        page: Int
                        perPage: Int
                        where: JSON
                        sort: JSON
                        search: I18NLocaleSearchInput
                    ): I18NLocaleListResponse
                }

                type I18NMutation {
                    createI18NLocale(data: I18NLocaleInput!): I18NLocaleResponse
                    updateI18NLocale(id: ID!, data: I18NLocaleInput!): I18NLocaleResponse
                    deleteI18NLocale(id: ID!): I18NLocaleDeleteResponse
                }
            `,
            resolvers: {
                Query: {
                    i18n: dummyResolver
                },
                Mutation: {
                    i18n: dummyResolver
                },
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
        },
        security: {
            shield: {
                I18NQuery: {
                    getI18NLocale: hasScope("i18n:locale:crud")
                    // listI18NLocales: hasScope("i18n:locale:crud") // Publicly visible.
                },
                I18NMutation: {
                    createI18NLocale: hasScope("i18n:locale:crud"),
                    updateI18NLocale: hasScope("i18n:locale:crud"),
                    deleteI18NLocale: hasScope("i18n:locale:crud")
                }
            }
        }
    }
]: Array<PluginType>);
