import { FormBuilderContext } from "~/types";

type CheckInstallationParams = Pick<FormBuilderContext, "tenancy" | "i18n">;
export const isInstallationPending = ({ tenancy, i18n }: CheckInstallationParams): boolean => {
    /**
     * In case of a fresh webiny project "tenant" and "locale" won't be there until
     * installation is completed. So, we need to skip "storage" creation till then.
     */
    const tenant = tenancy.getCurrentTenant();
    if (!tenant) {
        return true;
    }

    return !i18n.getContentLocale();
};
