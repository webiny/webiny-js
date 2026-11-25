import { getHeader } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";

/**
 * Reads the tenant id from the `x-tenant` header. A missing or empty header is no tenant, and the
 * tenant loader then uses the root tenant.
 */
export function extractTenantId(request: Pick<IHttpRequest, "headers">): string | null {
    return getHeader(request.headers, "x-tenant") || null;
}
