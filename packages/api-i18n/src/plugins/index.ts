import graphql from "./graphql";
import i18n from "./i18nContext";
import crud from "./crud";
import localeContexts from "./localeContexts";

export default () => [
    crud,
    localeContexts,
    graphql,
    i18n,
    {
        name: "context-i18n-get-locales",
        type: "context-i18n-get-locales",
        async resolve({ context }) {
            const { locales } = context;
            const list = await locales.list();
            return list.map(locale => ({
                code: locale.code,
                default: locale.default
            }));
        }
    }
];
