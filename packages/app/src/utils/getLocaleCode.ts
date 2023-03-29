import { isLocalhost } from "./isLocalhost";

declare global {
    interface Window {
        __PS_RENDER_LOCALE__: string;
    }
}

export const getLocaleCode = (): string | null => {
    // 1. Get locale via the `__locale` query param. Useful when doing page previews.
    let locale = new URLSearchParams(location.search).get("__locale");
    if (locale) {
        return locale;
    }

    // 2. Get locale via `window.__PS_RENDER_LOCALE__`. Used with prerendered pages.
    locale = window.__PS_RENDER_LOCALE__;
    if (locale) {
        return locale;
    }

    // 3. Get locale via `window.localStorage.webiny_i18n_locale`. Used within the Admin app.
    const localesByContext = window.localStorage.webiny_i18n_locale;
    if (localesByContext) {
        // The `localesByContext` is a string that contains locales for all available
        // "locale contexts", for example: `default:en-US;content:en-US;`. Here, we
        // want to extract the locale for the "content" locale context.
        const [, matchedLocale] = localesByContext.match(/content:(.*?);/);
        return matchedLocale;
    }

    // 4. Finally, for development purposes, we take the `WEBINY_WEBSITE_LOCALE_CODE`
    // and `WEBINY_ADMIN_LOCALE_CODE` environment variables into consideration.
    if (isLocalhost()) {
        return (
            process.env.WEBINY_WEBSITE_LOCALE_CODE || process.env.WEBINY_ADMIN_LOCALE_CODE || null
        );
    }

    return null;
};
