// @flow
import { dummyResolver } from "webiny-api/graphql";
import i18nLocale from "./graphql/I18NLocale";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-api-security";

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-i18n",
        schema: {
            namespace: "i18n",
            typeDefs: () => [
                i18nLocale.typeDefs,
                /* GraphQL */ `
                    type I18NQuery {
                        _empty: String
                    }

                    type I18NMutation {
                        _empty: String
                    }

                    type Query {
                        i18n: I18NQuery
                    }

                    type Mutation {
                        i18n: I18NMutation
                    }
                `,
                i18nLocale.typeExtensions
            ],
            resolvers: () => [
                {
                    Query: {
                        i18n: dummyResolver
                    },
                    Mutation: {
                        i18n: dummyResolver
                    }
                },
                i18nLocale.resolvers
            ]
        },
        security: {
            shield: {
                I18NQuery: {
                    getI18NLocale: hasScope("i18n:locale:crud"),
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
