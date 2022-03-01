import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";
import { ApolloLink } from "apollo-link";

declare global {
    interface Window {
        __PS_RENDER_TENANT__: string;
    }
}

/**
 * Append `x-tenant` header from URL query (necessary for prerendering service).
 */
export class TenantHeaderLinkPlugin extends ApolloLinkPlugin {
    private readonly tenant: string;

    public constructor(tenant?: string) {
        super();
        this.name = "tenant-header-link";

        if (!tenant) {
            const query = new URLSearchParams(location.search);
            tenant = query.get("__tenant") || window.__PS_RENDER_TENANT__;
        }

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
