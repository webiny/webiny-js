import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { RawTenantId } from "./RawTenantId.js";
import { RawAuthToken } from "./RawAuthToken.js";
import { RequestIdentityLoader } from "./RequestIdentityLoader.js";
import { RequestTenantLoader } from "./RequestTenantLoader.js";

/**
 * Registers the request-context pieces:
 * - RawTenantId / RawAuthToken: per-request holders that the transport's EXTRACT step writes to.
 * - RequestIdentityLoader / RequestTenantLoader: transport-agnostic LOAD steps that read
 *   the holders and set IdentityContext / TenantContext.
 */
export const RequestContextFeature = createFeature({
    name: "RequestContext",
    register(container: Container) {
        // Singleton so the value the transport's EXTRACT step sets is the same instance the LOAD
        // establisher reads. Registered per request (RequestContextFeature runs per-request), so it's
        // singleton *within the request container* — a fresh holder per request.
        container.register(RawTenantId).inSingletonScope();
        container.register(RawAuthToken).inSingletonScope();
        container.register(RequestIdentityLoader);
        container.register(RequestTenantLoader);
    }
});
