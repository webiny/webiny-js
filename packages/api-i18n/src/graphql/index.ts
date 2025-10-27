import { createBaseGraphQL } from "./graphql/base.js";
import { createLocalesGraphQL } from "./graphql/locales.js";
import { createI18NBaseContext } from "./context.js";
import localeContexts from "./localeContexts.js";
import type { ContextI18NGetLocales } from "~/types.js";

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
    return [createBaseGraphQL(), createLocalesGraphQL()];
};
/**
 * @deprecated for usage in old projects only
 */
export default () => [createI18NContext(), createI18NGraphQL()];
