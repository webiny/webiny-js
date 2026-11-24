import { getHeader } from "@webiny/event-handler-core";

/**
 * Reads the tenant id from the `x-tenant` header. A missing or empty header is no tenant, and the
 * tenant loader then uses the root tenant.
 */
export function extractTenantId(headers: Record<string, string> | undefined): string | null {
    return getHeader(headers, "x-tenant") || null;
}
