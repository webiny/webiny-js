import { createBaseGraphQL } from "./graphql/base";
import { createLocalesGraphQL } from "./graphql/locales";
import { createInstallationGraphQL } from "./graphql/installation";
import { createI18NBaseContext } from "./context";
import localeContexts from "./localeContexts";
import { createCrudContext } from "~/graphql/crud";
import { ContextI18NGetLocales, I18NContext } from "~/types";

/**
 * Create all the required context plugins for I18N to work.
 */
export const createI18NContext = () => {
    return [
        localeContexts,
        createCrudContext(),
        createI18NBaseContext(),
        {
            name: "context-i18n-get-locales",
            type: "context-i18n-get-locales",
            async resolve({ context }: { context: I18NContext }) {
                const { i18n } = context;
                const [items] = await i18n.locales.listLocales();
                return items.map(locale => ({
                    code: locale.code,
                    default: locale.default
                }));
            }
        } as ContextI18NGetLocales
    ];
};
/**
 * Create all the required GraphQL plugins for I18N to work.
 */
export const createI18NGraphQL = () => {
    return [createBaseGraphQL(), createInstallationGraphQL(), createLocalesGraphQL()];
};
/**
 * @deprecated for usage in old projects only
 */
export default () => [createI18NContext(), createI18NGraphQL()];
