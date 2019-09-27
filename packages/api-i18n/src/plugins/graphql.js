// @flow
import { merge } from "lodash";
import { gql } from "apollo-server-lambda";
import { emptyResolver } from "@webiny/commodo-graphql";
import { type PluginType } from "@webiny/api/types";
import { hasScope } from "@webiny/api-security";
import i18nLocale from "./graphql/I18NLocale";

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-i18n",
        schema: {
            typeDefs: gql`
                type I18NQuery {
                    _empty: String
                }

                type I18NMutation {
                    _empty: String
                }

                extend type Query {
                    i18n: I18NQuery
                }

                extend type Mutation {
                    i18n: I18NMutation
                }

                type I18NDeleteResponse {
                    data: Boolean
                    error: I18NError
                }

                type I18NListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
                }

                type I18NError {
                    code: String
                    message: String
                    data: JSON
                }

                ${i18nLocale.typeDefs}
            `,
            resolvers: merge(
                {
                    Query: {
                        i18n: emptyResolver
                    },
                    Mutation: {
                        i18n: emptyResolver
                    }
                },
                i18nLocale.resolvers
            )
        },
        security: {
            shield: {
                I18NQuery: {
                    getI18NLocale: hasScope("i18n:locale:crud"),
                    listI18NLocales: hasScope("i18n:locale:crud")
                    // getI18NInformation // Publicly visible.
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
