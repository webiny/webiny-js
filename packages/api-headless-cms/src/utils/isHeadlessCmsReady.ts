import type { CmsContext } from "~/types/index.js";

/**
 * TODO: Legacy function - review and remove!
 */
export const isHeadlessCmsReady = async ({ tenancy }: CmsContext): Promise<boolean> => {
    /**
     * In case of a fresh webiny project "tenant" won't be there until the installation is completed.
     */
    const tenant = tenancy.getCurrentTenant();
    if (!tenant) {
        return false;
    }

    return true;
};
