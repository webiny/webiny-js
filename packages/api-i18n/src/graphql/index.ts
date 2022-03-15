import { createBaseGraphQL } from "./graphql/base";
import { createLocalesGraphQL } from "./graphql/locales";
import { createInstallationGraphQL } from "./graphql/installation";
import { createI18NBaseContext } from "./context";
import localeContexts from "./localeContexts";
import { ContextI18NGetLocales } from "~/types";

const getLocalesPlugin: ContextI18NGetLocales = {
    name: "context-i18n-get-locales",
    type: "context-i18n-get-locales",
    async resolve({ context }) {
        const { i18n } = context;
        const [items] = await i18n.locales.listLocales();
        return items.map(locale => ({
            code: locale.code,
            default: !!locale.default
        }));
    }
};
/**
 * Create all the required context plugins for I18N to work.
 */
export const createI18NContext = () => {
    return [localeContexts, createI18NBaseContext(), getLocalesPlugin];
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
