import acceptLanguageParser from "accept-language-parser";
import {
    ContextI18NGetLocales,
    I18NContext,
    I18NContextObject,
    I18NLocale,
    LocaleKeys
} from "~/types";
import { ContextPlugin } from "@webiny/api";
import { NotAuthorizedError } from "@webiny/api-security";
import { I18NLocaleContextPlugin } from "~/plugins/I18NLocaleContextPlugin";
import { createCrudContext } from "~/graphql/crud";
import { hasI18NContentPermission } from "./hasI18NContentPermission";

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
    headers: Record<string, any>,
    localeContext: LocaleKeys = "default"
): GetLocaleFromHeadersResult => {
    let acceptLanguageHeader: string | null = null;
    let contextLocaleHeader: string | null = null;
    if (!headers) {
        return {
            acceptLanguageHeader,
            contextLocaleHeader
        };
    }

    for (const key in headers) {
        if (!headers.hasOwnProperty(key)) {
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

    return {
        acceptLanguageHeader,
        contextLocaleHeader
    };
};

interface I18NCache {
    acceptLanguage: string | null;
    defaultLocale: I18NLocale | null;
    locale: Map<LocaleKeys, I18NLocale | undefined>;
    locales: I18NLocale[];
}

// TODO: refactor this context factory following the newer applications (e.g., api-tenancy, api-security)
const createBaseContextPlugin = () => {
    return new ContextPlugin<I18NContext>(async context => {
        const loadLocales = () => {
            if (!context.tenancy.getCurrentTenant()) {
                return [];
            }

            const plugin = context.plugins.byName<ContextI18NGetLocales>(
                "context-i18n-get-locales"
            );
            if (!plugin) {
                throw new Error('Cannot load locales - missing "context-i18n-get-locales" plugin.');
            }
            return plugin.resolve({ context });
        };

        const { plugins } = context;

        const { headers = {} } = context.request;

        const __i18n: I18NCache = {
            acceptLanguage: "",
            defaultLocale: null,
            locale: new Map(),
            locales: await loadLocales()
        };

        const getDefaultLocale = () => {
            const allLocales = getLocales();
            const locale = allLocales.find(item => item.default);

            if (locale) {
                return locale;
            }

            return allLocales.find(item => item.code.match("en") !== null);
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

        const getCurrentLocale = (
            localeContext: LocaleKeys = "default"
        ): I18NLocale | undefined => {
            if (__i18n.locale.has(localeContext)) {
                return __i18n.locale.get(localeContext);
            }

            const allLocales = getLocales();

            let currentLocale: I18NLocale | undefined;
            const { acceptLanguageHeader, contextLocaleHeader } = getLocaleFromHeaders(
                headers,
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

            __i18n.locale.set(localeContext, currentLocale);

            return __i18n.locale.get(localeContext);
        };

        const getLocales = (): I18NLocale[] => {
            return __i18n.locales;
        };

        const getLocale = (code: string) => {
            const item = __i18n.locales.find(
                locale => locale.code.toLowerCase() === code.toLowerCase()
            );

            if (!item) {
                return undefined;
            }
            return item;
        };

        const setCurrentLocale: I18NContextObject["setCurrentLocale"] = (localeContext, locale) => {
            __i18n.locale.set(localeContext, locale);
        };

        const checkI18NContentPermission = async () => {
            if (await hasI18NContentPermission(context)) {
                return;
            }

            throw new NotAuthorizedError();
        };

        const setContentLocale: I18NContextObject["setContentLocale"] = locale => {
            setCurrentLocale("content", locale);
        };

        const getContentLocale: I18NContextObject["getContentLocale"] = () => {
            return getCurrentLocale("content");
        };

        const reloadLocales = async () => {
            __i18n.locales = await loadLocales();
        };

        context.i18n = {
            ...(context.i18n || ({} as any)),
            getDefaultLocale,
            setCurrentLocale,
            getCurrentLocales,
            getCurrentLocale,
            getContentLocale,
            setContentLocale,
            getLocales,
            getLocale,
            reloadLocales,
            hasI18NContentPermission: () => hasI18NContentPermission(context),
            checkI18NContentPermission
        };
    });
};

const plugins = [createCrudContext(), createBaseContextPlugin()];

export const createI18NBaseContext = () => {
    return plugins;
};

export default () => createI18NBaseContext();
