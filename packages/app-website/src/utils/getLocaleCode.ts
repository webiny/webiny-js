declare global {
    interface Window {
        __PS_RENDER_LOCALE__: string;
    }
}

export const getLocaleCode = () => {
    // 1. Get locale via the `__locale` query param. Useful when doing page previews.
    let locale = new URLSearchParams(location.search).get("__locale");
    if (locale) {
        return locale;
    }

    // 2. Get locale via `window.__PS_RENDER_LOCALE__`. Used with prerendered pages.
    locale = window.__PS_RENDER_LOCALE__
    if (locale) {
        return locale;
    }

    // 3. Get locale via `window.localStorage.webiny_i18n_locale`. Used within the Admin app.
    const localesByContext = window.localStorage.webiny_i18n_locale;
    if (localesByContext) {
        // The `localesByContext` is a string that contains locales for all available
        // "locale contexts", for example: `default:en-US;content:en-US;`. Here, we
        // want to extract the locale for the "content" locale context.
        const [,matchedLocale] = localesByContext.match(/content:(.*?);/)
        return matchedLocale;
    }

    // 4. Finally, for development purposes, we also want to take the
    // `REACT_APP_WEBSITE_LOCALE` environment variable into consideration.
    return process.env.REACT_APP_WEBSITE_LOCALE || null;
};