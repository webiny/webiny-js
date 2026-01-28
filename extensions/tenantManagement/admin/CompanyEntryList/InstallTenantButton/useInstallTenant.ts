import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { useRecords } from "@webiny/app-aco";
import { CompanyEntry } from "../../types";
import { InstallTenantResponse, INSTALL_TENANT } from "./installTenant.gql";

export const useInstallTenant = (company: CompanyEntry) => {
    const { showSnackbar } = useSnackbar();
    const { updateRecordInCache } = useRecords();
    const [runMutation, mutation] = useMutation<InstallTenantResponse>(INSTALL_TENANT);

    const installTenant = useCallback(async () => {
        const { data } = await runMutation({ variables: { companyId: company.entryId } });
        if (data?.installCompanyTenant.error) {
            showSnackbar(data.installCompanyTenant.error.message);
            return;
        }

        updateRecordInCache({ ...company, isInstalled: true });
    }, [company]);

    return { installTenant, loading: mutation.loading };
};
