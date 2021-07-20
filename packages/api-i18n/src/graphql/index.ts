import graphql from "./graphql";
import locales from "./graphql/locales";
import installation from "./graphql/installation";
import i18nContext from "./context";
import localeContexts from "./localeContexts";

export default () => [
    localeContexts,
    i18nContext(),
    graphql,
    locales,
    installation,
    {
        name: "context-i18n-get-locales",
        type: "context-i18n-get-locales",
        async resolve({ context }) {
            const { i18n } = context;
            const [items] = await i18n.locales.list();
            return items.map(locale => ({
                code: locale.code,
                default: locale.default
            }));
        }
    }
];
