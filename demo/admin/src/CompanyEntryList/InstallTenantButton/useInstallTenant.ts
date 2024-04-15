import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { useRecords } from "@webiny/app-aco";
import { Company } from "../../types";
import { InstallTenantResponse, INSTALL_TENANT } from "./installTenant.gql";
import { useSnackbar } from "@webiny/app-admin";

export const useInstallTenant = (company: Company) => {
    const { showSnackbar } = useSnackbar();
    const { updateRecordInCache } = useRecords();
    const [runMutation, mutation] = useMutation<InstallTenantResponse>(INSTALL_TENANT);
    const installTenant = useCallback(async () => {
        const { data } = await runMutation({ variables: { companyId: company.id } });
        if (data?.installCompanyTenant.error) {
            showSnackbar(data.installCompanyTenant.error.message);
            return;
        }

        updateRecordInCache({ ...company, isInstalled: true });
    }, [company]);

    return { installTenant, loading: mutation.loading };
};
