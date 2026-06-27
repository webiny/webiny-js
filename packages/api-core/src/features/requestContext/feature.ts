import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { RequestIdentityEstablisher } from "./RequestIdentityEstablisher.js";
import { RequestTenantEstablisher } from "./RequestTenantEstablisher.js";

/**
 * Registers the transport-agnostic request identity/tenant establishers. Transports contribute
 * their own AuthTokenExtractor / TenantIdExtractor implementations; these resolve them to set
 * IdentityContext / TenantContext.
 */
export const RequestContextFeature = createFeature({
    name: "RequestContext",
    register(container: Container) {
        container.register(RequestIdentityEstablisher);
        container.register(RequestTenantEstablisher);
    }
});
