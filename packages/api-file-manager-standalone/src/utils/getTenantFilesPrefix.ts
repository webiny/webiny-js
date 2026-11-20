import { TENANTS_KEY_PREFIX } from "./tenantsKeyPrefix.js";

/*
 * The key prefix every file of a tenant is stored under. A tenant ID with a `/` is refused: its
 * prefix would contain another tenant's files.
 */
export const getTenantFilesPrefix = (tenantId: string): string => {
    if (!tenantId || tenantId.includes("/") || tenantId === "." || tenantId === "..") {
        throw new Error(`Invalid tenant ID: "${tenantId}".`);
    }
    return `${TENANTS_KEY_PREFIX}${tenantId}/files/`;
};
