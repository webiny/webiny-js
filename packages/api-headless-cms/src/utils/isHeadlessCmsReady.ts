import type { CmsContext } from "~/types/index.js";

export const isHeadlessCmsReady = async ({ tenancy }: CmsContext): Promise<boolean> => {
    /**
     * In case of a fresh webiny project "tenant" and "locale" won't be there until the installation is completed.
     */
    const tenant = tenancy.getCurrentTenant();
    if (!tenant) {
        return false;
    }

    return true;
};
