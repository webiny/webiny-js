import { ContextPlugin } from "@webiny/handler/types";
import acceptLanguageParser from "accept-language-parser";
import {
    I18NContext,
    ContextI18NGetLocales,
    I18NLocaleContextPlugin,
    I18NContextObject
} from "@webiny/api-i18n/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ClientContext } from "@webiny/handler-client/types";

// Parses "x-i18n-locale" header value (e.g. "default:en-US;content:hr-HR;").
const parseXI18NLocaleHeader = value => {
    if (parseXI18NLocaleHeader.cache[value]) {
        return parseXI18NLocaleHeader.cache[value];
    }

    // Parsing x-i18n-locale value (e.g. "default:en-US;content:hr-HR;").
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

    let acceptLanguageHeader, contextLocaleHeader;
    for (const key in http.headers) {
        const lcKey = key.toLowerCase();
        if (lcKey === "accept-language") {
            acceptLanguageHeader = http.headers[key];
        } else if (lcKey === "x-i18n-locale") {
            const parsed = parseXI18NLocaleHeader(http.headers[key]);
            contextLocaleHeader = parsed[localeContext];
        }

        if (acceptLanguageHeader && contextLocaleHeader) {
            break;
        }
    }

    return { acceptLanguageHeader, contextLocaleHeader };
};

export default {
    type: "context",
    apply: async context => {
        const locales = context.plugins.byName<ContextI18NGetLocales>("context-i18n-get-locales");
        if (!locales) {
            throw new Error('Cannot load locales - missing "context-i18n-get-locales" plugin.');
        }

        const { http, plugins } = context;
        const self: I18NContextObject = {
            __i18n: {
                acceptLanguage: null,
                defaultLocale: null,
                locale: {}, // Contains one or more locales - for multiple locale contexts.
                locales: await locales.resolve({ context })
            },
            getDefaultLocale() {
                const allLocales = self.getLocales();
                return allLocales.find(item => item.default === true);
            },
            getCurrentLocales() {
                const localeContexts = plugins.byType<I18NLocaleContextPlugin>(
                    "i18n-locale-context"
                );
                return localeContexts.map(plugin => ({
                    context: plugin.context.name,
                    locale: self.getCurrentLocale(plugin.context.name)?.code
                }));
            },
            getCurrentLocale(localeContext = "default") {
                if (self.__i18n.locale[localeContext]) {
                    return self.__i18n.locale[localeContext];
                }

                const allLocales = self.getLocales();

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
                    currentLocale = self.getDefaultLocale();
                }

                self.__i18n.locale[localeContext] = currentLocale;

                return self.__i18n.locale[localeContext];
            },
            getLocales() {
                return self.__i18n.locales;
            },
            // @ts-ignore TODO: remove
            getValue(value) {
                if (!value) {
                    return "";
                }

                if (Array.isArray(value.values)) {
                    const locale = self.getCurrentLocales();
                    if (!locale) {
                        return "";
                    }

                    // @ts-ignore
                    const valuesValue = value.values.find(value => value.locale === locale.id);
                    return valuesValue ? valuesValue.value : "";
                }

                return value.value || "";
            }
        };

        context.i18n = self;
    }
} as ContextPlugin<HttpContext, I18NContext, ClientContext>;
