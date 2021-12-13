import acceptLanguageParser from "accept-language-parser";
import { ContextI18NGetLocales, I18NContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { I18NLocaleContextPlugin } from "~/plugins/I18NLocaleContextPlugin";
/**
 * Parses "x-i18n-locale" header value (e.g. "default:en-US;content:hr-HR;").
 */
const parseXI18NLocaleHeader = value => {
    if (parseXI18NLocaleHeader.cache[value]) {
        return parseXI18NLocaleHeader.cache[value];
    }

    /**
     * Parsing x-i18n-locale value (e.g. "default:en-US;content:hr-HR;").
     */
    parseXI18NLocaleHeader.cache[value] = value
        .split(";")
        .filter(Boolean)
        .map(item => item.split(":"))
        .reduce((current, [context, locale]) => {
            current[context] = locale;
            return current;
        }, {});

    return parseXI18NLocaleHeader.cache[value];
};

parseXI18NLocaleHeader.cache = {};

const getLocaleFromHeaders = (http, localeContext = "default") => {
    if (!http) {
        return null;
    }

    const { headers = {} } = http.request;

    let acceptLanguageHeader, contextLocaleHeader;
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

export const createI18NBaseContext = () => {
    return new ContextPlugin<I18NContext>(async context => {
        let locales = [];
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

        const __i18n = {
            acceptLanguage: null,
            defaultLocale: null,
            locale: {}, // Contains one or more locales - for multiple locale contexts.
            locales
        };
        const getDefaultLocale = () => {
            const allLocales = getLocales();
            return allLocales.find(item => item.default === true);
        };
        const getCurrentLocales = () => {
            const localeContexts = plugins.byType<I18NLocaleContextPlugin>(
                I18NLocaleContextPlugin.type
            );
            return localeContexts.map(plugin => ({
                context: plugin.context.name,
                locale: getCurrentLocale(plugin.context.name)?.code
            }));
        };
        const getCurrentLocale = (localeContext = "default") => {
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
        const getLocales = () => {
            return __i18n.locales;
        };
        const getLocale = code => {
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
