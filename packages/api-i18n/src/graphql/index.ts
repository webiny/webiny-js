import graphql from "./graphql";
import i18nContext from "./context";
import localeContexts from "./localeContexts";

export default () => [
    localeContexts,
    i18nContext(),
    graphql,
    {
        name: "context-i18n-get-locales",
        type: "context-i18n-get-locales",
        async resolve({ context }) {
            const { i18n } = context;
            const list = await i18n.locales.list();
            return list.map(locale => ({
                code: locale.code,
                default: locale.default
            }));
        }
    }
];
