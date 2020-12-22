export const locales = {
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

export const mockLocalesPlugins = () => ({
    name: "context-i18n-get-locales",
    type: "context-i18n-get-locales",
    async resolve() {
        return Object.values(locales);
    }
});
