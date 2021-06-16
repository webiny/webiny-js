import { ContextPlugin } from "@webiny/handler/types";
import acceptLanguageParser from "accept-language-parser";
import {
    ContextI18NGetLocales,
    I18NContext,
    I18NContextObject,
    I18NLocaleContextPlugin
} from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import localesCRUD from "./crud/locales.crud";
import systemCRUD from "./crud/system.crud";

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

    const { headers } = http.request;

    let acceptLanguageHeader, contextLocaleHeader;
    for (const key in headers) {
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

export default (): ContextPlugin<I18NContext, TenancyContext> => ({
    type: "context",
    apply: async context => {
        context.i18n = {
            locales: localesCRUD(context)
        } as I18NContextObject;

        context.i18n.system = systemCRUD(context);

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
        const self: Partial<I18NContextObject> = {
            __i18n: {
                acceptLanguage: null,
                defaultLocale: null,
                locale: {}, // Contains one or more locales - for multiple locale contexts.
                locales
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
            getLocale(code) {
                const item = self.__i18n.locales.find(
                    locale => locale.code.toLowerCase() === code.toLowerCase()
                );
                if (!item) {
                    return null;
                }
                return item;
            }
        };

        Object.assign(context.i18n, self);
    }
});
