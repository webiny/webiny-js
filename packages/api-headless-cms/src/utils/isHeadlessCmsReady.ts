import type { CmsContext } from "~/types/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

/**
 * TODO: Legacy function - review and remove!
 */
export const isHeadlessCmsReady = async (context: CmsContext): Promise<boolean> => {
    /**
     * In case of a fresh webiny project "tenant" won't be there until the installation is completed.
     */
    const tenant = context.container.resolve(TenantContext).getTenant();
    if (!tenant) {
        return false;
    }

    return true;
};
