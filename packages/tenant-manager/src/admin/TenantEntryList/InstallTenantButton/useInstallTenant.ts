import { useCallback } from "react";
import { useToast } from "@webiny/admin-ui";
import { TenantEntry } from "../../types.js";
import { useInstallTenant as baseInstallTenant } from "~/admin/InstallTenant/index.js";

export const useInstallTenant = (tenant: TenantEntry) => {
    const toast = useToast();
    const hook = baseInstallTenant();

    const installTenant = useCallback(async () => {
        try {
            await hook.installTenant(tenant.entryId);
        } catch (error) {
            toast.showWarningToast({
                title: "Could not install tenant",
                description: error.message,
                duration: Infinity
            });
            return;
        }

        toast.showSuccessToast({ title: "Tenant installed successfully!" });
    }, [tenant]);

    return { installTenant, loading: hook.loading };
};
