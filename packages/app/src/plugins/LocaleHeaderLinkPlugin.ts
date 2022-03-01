import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";
import { ApolloLink } from "apollo-link";

declare global {
    interface Window {
        __PS_RENDER_LOCALE__: string;
    }
}

/**
 * Append `x-i18n-locale` header from URL query (necessary for prerendering service).
 */
export class LocaleHeaderLinkPlugin extends ApolloLinkPlugin {
    private readonly locale: string;

    constructor(locale?: string) {
        super();

        if (!locale) {
            const query = new URLSearchParams(location.search);
            locale = query.get("__locale") || window.__PS_RENDER_LOCALE__;
        }

        this.locale = locale;
    }

    public override createLink(): ApolloLink {
        return setContext((_, { headers }) => {
            if (this.locale) {
                return {
                    headers: {
                        ...headers,
                        "x-i18n-locale": `content:${this.locale};`
                    }
                };
            }

            return { headers };
        });
    }
}
