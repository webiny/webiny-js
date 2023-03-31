import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";
import { ApolloLink } from "apollo-link";
import { getLocaleCode } from "~/utils";

/**
 * Append `x-i18n-locale` header from URL query (necessary for prerendering service).
 */
export class LocaleHeaderLinkPlugin extends ApolloLinkPlugin {
    private readonly locale: string;

    constructor(locale?: string) {
        super();

        this.locale = locale || (getLocaleCode() as string);
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
