import { useCallback } from "react";
import { useToast } from "@webiny/admin-ui";
import { useRecords } from "@webiny/app-aco";
import { TenantEntry } from "../../types.js";
import { useEnableTenant as baseEnableTenant } from "~/admin/EnableTenant/index.js";

export const useEnableTenant = (tenant: TenantEntry) => {
    const toast = useToast();
    const { updateRecordInCache } = useRecords();
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

        updateRecordInCache({
            ...tenant,
            values: {
                ...tenant.values,
                status: "enabled"
            }
        });
    }, [tenant]);

    return { enableTenant, loading: useCase.loading };
};
