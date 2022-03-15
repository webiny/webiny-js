import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";

interface Input {
    headers: Record<string, string>;
}
interface Output {
    headers: Record<string, string>;
}
export default new ApolloLinkPlugin(() => {
    return setContext(async (_, { headers }: Input): Promise<Output> => {
        const localeStorageLocales = localStorage.getItem("webiny_i18n_locale");
        if (!localeStorageLocales) {
            return { headers };
        }

        return {
            headers: {
                ...headers,
                /**
                 * We can pretend that there is locale in the local storage
                 */
                "x-i18n-locale": localStorage.getItem("webiny_i18n_locale") as string
            }
        };
    });
});
