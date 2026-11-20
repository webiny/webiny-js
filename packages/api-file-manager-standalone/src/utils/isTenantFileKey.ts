import { getTenantFilesPrefix } from "./getTenantFilesPrefix.js";
import { isKeyInsidePrefix } from "./isKeyInsidePrefix.js";

/* Whether a storage key names a file inside the tenant's files. */
export const isTenantFileKey = (tenantId: string, key: string): boolean => {
    try {
        const prefix = getTenantFilesPrefix(tenantId);
        return isKeyInsidePrefix(key, prefix);
    } catch {
        return false;
    }
};
