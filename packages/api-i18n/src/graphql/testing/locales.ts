import { ContextI18NGetLocales, I18NLocale } from "~/types";

export const locales: Record<string, I18NLocale> = {
    en: {
        code: "en-US",
        default: true
    },
    de: {
        code: "de-DE",
        default: false
    },
    it: {
        code: "it-IT",
        default: false
    }
};

export const mockLocalesPlugins = (): ContextI18NGetLocales => ({
    name: "context-i18n-get-locales",
    type: "context-i18n-get-locales",
    async resolve() {
        return Object.values(locales);
    }
});
