import { getTenantFilesPrefix } from "./getTenantFilesPrefix.js";
import { isKeyInsidePrefix } from "./isKeyInsidePrefix.js";

/*
 * The storage key of a tenant's file, from its key relative to the tenant's files. Throws when the
 * result would not be inside the tenant's files.
 */
export const toTenantFileKey = (tenantId: string, fileKey: string): string => {
    const prefix = getTenantFilesPrefix(tenantId);
    const key = `${prefix}${fileKey}`;
    if (!isKeyInsidePrefix(key, prefix)) {
        throw new Error("Invalid file key.");
    }
    return key;
};
