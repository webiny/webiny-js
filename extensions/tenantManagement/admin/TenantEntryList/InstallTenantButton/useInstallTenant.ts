import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { useToast } from "webiny/admin/ui";
import { useRecords } from "webiny/admin/aco";
import { TenantEntry } from "../../types";
import { InstallTenantResponse, INSTALL_TENANT } from "./installTenant.gql";

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

        updateRecordInCache({ ...tenant, isInstalled: true });
    }, [tenant]);

    return { installTenant, loading: mutation.loading };
};
