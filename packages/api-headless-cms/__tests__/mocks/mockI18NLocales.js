export const locales = {
    en: {
        id: "5e3147371d35c92fd86ef7d8",
        code: "en-US",
        default: true
    },
    de: {
        id: "5e31473f1d35c92fd86ef7d9",
        code: "de-DE",
        default: false
    },
    it: {
        id: "5e3147fd1d35c92fd86ef7da",
        code: "it-IT",
        default: false
    }
};

export default () => ({
    name: "graphql-context-i18n-get-locales",
    type: "graphql-context-i18n-get-locales",
    async resolve() {
        return Object.values(locales);
    }
});
