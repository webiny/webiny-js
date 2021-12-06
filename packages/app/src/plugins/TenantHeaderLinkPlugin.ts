import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";

declare global {
    interface Window {
        __PS_RENDER_TENANT__: string;
    }
}

/**
 * Append `x-tenant` header from URL query (necessary for prerendering service).
 */
export class TenantHeaderLinkPlugin extends ApolloLinkPlugin {
    private tenant: string;

    constructor(tenant?: string) {
        super();
        this.name = "tenant-header-link";

        if (!tenant) {
            const query = new URLSearchParams(location.search);
            tenant = query.get("__tenant") || window.__PS_RENDER_TENANT__;
        }

        this.tenant = tenant;

        console.log("Detected tenant", this.tenant);
    }

    createLink() {
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
