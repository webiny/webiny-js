import models from "./models";
import graphql from "./graphql";
import i18n from "./i18n";

export default () => [
    models(),
    graphql,
    i18n,
    {
        name: "graphql-context-i18n-get-locales",
        type: "graphql-context-i18n-get-locales",
        async resolve({ context }) {
            const { I18NLocale } = context.models;
            const locales = await I18NLocale.find();
            return locales.map(locale => ({
                id: locale.id,
                code: locale.code,
                default: locale.default,
                createdOn: locale.createdOn
            }));
        }
    }
];
