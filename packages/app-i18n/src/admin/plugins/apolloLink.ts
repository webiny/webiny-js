import { setContext } from "apollo-link-context";

export default {
    type: "apollo-link",
    createLink() {
        return setContext(async (_, { headers }) => {
            const localeStorageLocales = localStorage.getItem("wby_i18n_locale");
            if (!localeStorageLocales) {
                return { headers };
            }

            return {
                headers: {
                    ...headers,
                    "x-i18n-locale": localStorage.getItem("wby_i18n_locale")
                }
            };
        });
    }
};
