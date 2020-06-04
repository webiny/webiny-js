export const locales = {
    en: {
        id: "eeeeeeeeeeeeeeeeeeeeeeee",
        code: "en-US",
        default: true
    },
    de: {
        id: "dddddddddddddddddddddddd",
        code: "de-DE",
        default: false
    },
    it: {
        id: "cccccccccccccccccccccccc",
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
