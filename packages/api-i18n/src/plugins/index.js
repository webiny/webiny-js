// @flow
import models from "./models";
import graphql from "./graphql";
import i18n from "./i18n";

let localesCache;

export default config => [
    models(config),
    graphql,
    i18n,
    {
        name: "graphql-context-i18n-get-locales",
        type: "graphql-context-i18n-get-locales",
        async resolve({ context }) {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            const { I18NLocale } = context.models;

            localesCache = (await I18NLocale.find()).map(locale => ({
                id: locale.id,
                code: locale.code,
                default: locale.default
            }));

            return localesCache;
        }
    }
];
