import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";

export default new ApolloLinkPlugin(() => {
    return setContext(async (_, { headers }) => {
        const localeStorageLocales = localStorage.getItem("webiny_i18n_locale");
        if (!localeStorageLocales) {
            return { headers };
        }

        return {
            headers: {
                ...headers,
                "x-i18n-locale": localStorage.getItem("webiny_i18n_locale")
            }
        };
    });
});
