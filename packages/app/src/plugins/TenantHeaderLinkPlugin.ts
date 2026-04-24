import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin.js";
import type { ApolloLink } from "apollo-link";

/**
 * Append `x-tenant` header from URL query (necessary for prerendering service).
 */
export class TenantHeaderLinkPlugin extends ApolloLinkPlugin {
    private readonly tenant: string;

    public constructor(tenant: string) {
        super();
        this.name = "tenant-header-link";

        this.tenant = tenant;
    }

    public override createLink(): ApolloLink {
        return setContext((_, { headers }) => {
            // If tenant header is already set, do not overwrite it.
            if (headers && "x-tenant" in headers) {
                return { headers };
            }

            if (this.tenant) {
                return {
                    headers: {
                        ...headers,
                        "x-tenant": this.tenant
                    }
                };
            }

            return { headers };
        });
    }
}
