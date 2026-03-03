import { useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@webiny/admin-ui";
import { useRecords } from "@webiny/app-aco";
import { TenantEntry } from "../../types.js";
import { InstallTenantResponse, INSTALL_TENANT } from "./installTenant.gql.js";

export const useInstallTenant = (tenant: TenantEntry) => {
    const toast = useToast();
    const { updateRecordInCache } = useRecords();
    const [runMutation, mutation] = useMutation<InstallTenantResponse>(INSTALL_TENANT);

    const installTenant = useCallback(async () => {
        const { data } = await runMutation({ variables: { tenantId: tenant.entryId } });
        if (data?.tenantManager.installTenant.error) {
            toast.showWarningToast({
                title: "Could not install tenant",
                description: data?.tenantManager.installTenant.error.message,
                duration: Infinity
            });
            return;
        }

        toast.showSuccessToast({ title: "Tenant installed successfully!" });

        updateRecordInCache({
            ...tenant,
            values: {
                ...tenant.values,
                status: "enabled",
                isInstalled: true
            }
        });
    }, [tenant]);

    return { installTenant, loading: mutation.loading };
};
