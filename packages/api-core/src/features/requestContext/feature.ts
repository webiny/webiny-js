import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { RawTenantId } from "./RawTenantId.js";
import { RawAuthToken } from "./RawAuthToken.js";
import { RawAssumePermissions } from "./RawAssumePermissions.js";
import { RequestIdentityLoader } from "./RequestIdentityLoader.js";
import { RequestTenantLoader } from "./RequestTenantLoader.js";

/**
 * The tenant-neutral part of the request context, for the request container:
 * - RawTenantId / RawAuthToken / RawAssumePermissions: per-request holders that the transport's
 *   EXTRACT step writes to.
 * - RequestTenantLoader: the transport-agnostic LOAD step that resolves the request's tenant.
 */
export const TenantNeutralRequestContextFeature = createFeature({
    name: "TenantNeutralRequestContext",
    register(container: Container) {
        // Singleton so the value the transport's EXTRACT step sets is the same instance the LOAD
        // establisher reads. Registered per request, so it's singleton *within the request
        // container* — a fresh holder per request, shared by every tenant scope of it.
        container.register(RawTenantId).inSingletonScope();
        container.register(RawAuthToken).inSingletonScope();
        container.register(RawAssumePermissions).inSingletonScope();
        container.register(RequestTenantLoader);
    }
});

/**
 * The tenant scope's part of the request context: RequestIdentityLoader, which authenticates the
 * raw token. Identity depends on the tenant (an API key is looked up in it, permissions are the
 * tenant's), so it loads inside the tenant's scope.
 */
export const TenantScopeRequestContextFeature = createFeature({
    name: "TenantScopeRequestContext",
    register(container: Container) {
        container.register(RequestIdentityLoader);
    }
});

/** Both parts, in one container. */
export const RequestContextFeature = createFeature({
    name: "RequestContext",
    register(container: Container) {
        TenantNeutralRequestContextFeature.register(container);
        TenantScopeRequestContextFeature.register(container);
    }
});
