import { useCallback } from "react";
import { useToast } from "@webiny/admin-ui";
import { TenantEntry } from "../../types.js";
import { useEnableTenant as baseEnableTenant } from "~/admin/EnableTenant/index.js";

export const useEnableTenant = (tenant: TenantEntry) => {
    const toast = useToast();
    const useCase = baseEnableTenant();

    const enableTenant = useCallback(async () => {
        try {
            await useCase.enableTenant(tenant.entryId);
        } catch (error) {
            toast.showWarningToast({
                title: "Could not enable tenant",
                description: error.message,
                duration: Infinity
            });
            return;
        }

        toast.showSuccessToast({ title: "Tenant was enabled successfully!" });
    }, [tenant]);

    return { enableTenant, loading: useCase.loading };
};
