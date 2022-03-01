import acceptLanguageParser from "accept-language-parser";
import {
    ContextI18NGetLocales,
    I18NContext,
    I18NContextObject,
    I18NLocale,
    LocaleKeys
} from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { I18NLocaleContextPlugin } from "~/plugins/I18NLocaleContextPlugin";
import { createCrudContext } from "~/graphql/crud";
import { HttpObject } from "@webiny/handler-http/types";

interface Locales {
    content: string;
    default: string;
}
const headerCache: Record<string, Locales> = {};
/**
 * Parses "x-i18n-locale" header value (e.g. "default:en-US;content:hr-HR;").
 */
const parseXI18NLocaleHeader = (value: string): Locales => {
    if (headerCache[value]) {
        return headerCache[value];
    }

    /**
     * Parsing x-i18n-locale value (e.g. "default:en-US;content:hr-HR;").
     */
    headerCache[value] = value
        .split(";")
        .filter(Boolean)
        .map(item => {
            return item.split(":") as [keyof Locales, string];
        })
        .reduce((current, [context, locale]) => {
            current[context] = locale;
            return current;
        }, {} as Locales);

    return headerCache[value];
};

interface GetLocaleFromHeadersResult {
    acceptLanguageHeader: string | null;
    contextLocaleHeader: string | null;
}
const getLocaleFromHeaders = (
    http: HttpObject,
    localeContext: LocaleKeys = "default"
): GetLocaleFromHeadersResult => {
    let acceptLanguageHeader: string | null = null;
    let contextLocaleHeader: string | null = null;
    if (!http || !http.request || !http.request.headers) {
        return {
            acceptLanguageHeader,
            contextLocaleHeader
        };
    }

    const { headers = {} } = http.request;

    for (const key in headers) {
        if (headers.hasOwnProperty(key) === false) {
            continue;
        }
        const lcKey = key.toLowerCase();
        if (lcKey === "accept-language") {
            acceptLanguageHeader = headers[key];
        } else if (lcKey === "x-i18n-locale") {
            const parsed = parseXI18NLocaleHeader(headers[key]);
            contextLocaleHeader = parsed[localeContext];
        }

        if (acceptLanguageHeader && contextLocaleHeader) {
            break;
        }
    }

    return { acceptLanguageHeader, contextLocaleHeader };
};

const createBaseContextPlugin = () => {
    return new ContextPlugin<I18NContext>(async context => {
        let locales: I18NLocale[] = [];
        if (context.tenancy.getCurrentTenant()) {
            const plugin = context.plugins.byName<ContextI18NGetLocales>(
                "context-i18n-get-locales"
            );
            if (!plugin) {
                throw new Error('Cannot load locales - missing "context-i18n-get-locales" plugin.');
            }
            locales = await plugin.resolve({ context });
        }

        const { http, plugins } = context;

        const __i18n: I18NContextObject["__i18n"] = {
            acceptLanguage: "",
            defaultLocale: null,
            locale: {}, // Contains one or more locales - for multiple locale contexts.
            locales
        };
        const getDefaultLocale = (): I18NLocale | null => {
            const allLocales = getLocales();
            const locale = allLocales.find(item => item.default === true);

            if (locale) {
                return locale;
            }
            const enLocale = allLocales.find(item => {
                return item.code.match("en") !== null;
            });
            return enLocale || null;
        };
        const getCurrentLocales = () => {
            const localeContexts = plugins.byType<I18NLocaleContextPlugin>(
                I18NLocaleContextPlugin.type
            );
            return localeContexts.map(plugin => {
                const currentLocale = getCurrentLocale(plugin.context.name);
                return {
                    context: plugin.context.name,
                    locale: currentLocale ? currentLocale.code : null
                };
            });
        };
        const getCurrentLocale = (localeContext: LocaleKeys = "default"): I18NLocale | null => {
            if (__i18n.locale[localeContext]) {
                return __i18n.locale[localeContext];
            }

            const allLocales = getLocales();

            let currentLocale;
            const { acceptLanguageHeader, contextLocaleHeader } = getLocaleFromHeaders(
                http,
                localeContext
            );

            // Try to select from received context locale.
            let localeFromHeaders = contextLocaleHeader;
            if (!localeFromHeaders && acceptLanguageHeader) {
                localeFromHeaders = acceptLanguageParser.pick(
                    allLocales.map(item => item.code),
                    acceptLanguageHeader
                );
            }

            if (localeFromHeaders) {
                currentLocale = allLocales.find(item => item.code === localeFromHeaders);
            }

            if (!currentLocale) {
                currentLocale = getDefaultLocale();
            }

            __i18n.locale[localeContext] = currentLocale;

            return __i18n.locale[localeContext];
        };
        const getLocales = (): I18NLocale[] => {
            return __i18n.locales;
        };
        const getLocale = (code: string): I18NLocale | null => {
            const item = __i18n.locales.find(
                locale => locale.code.toLowerCase() === code.toLowerCase()
            );
            if (!item) {
                return null;
            }
            return item;
        };

        context.i18n = {
            ...(context.i18n || ({} as any)),
            __i18n,
            getDefaultLocale,
            getCurrentLocales,
            getCurrentLocale,
            getLocales,
            getLocale
        };
    });
};

const plugins = [createCrudContext(), createBaseContextPlugin()];

export const createI18NBaseContext = () => {
    return plugins;
};

export default () => createI18NBaseContext();
