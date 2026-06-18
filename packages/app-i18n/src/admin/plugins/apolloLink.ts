import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";

interface Input {
    headers: Record<string, string>;
}

interface Output {
    headers: Record<string, string>;
}

export const createApolloLinkPlugin = (getLocale: () => string | undefined) => {
    return new ApolloLinkPlugin(() => {
        return setContext(async (_, { headers }: Input): Promise<Output> => {
            const locale = getLocale();
            if (!locale) {
                return { headers };
            }

            return {
                headers: {
                    ...headers,
                    "x-i18n-locale": locale
                }
            };
        });
    });
};
