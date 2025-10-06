import { useCallback } from "react";
import get from "lodash/get.js";
import omit from "lodash/omit.js";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useTenancy, useSnackbar } from "@webiny/app-admin";
import { GET_TENANT, UPDATE_TENANT } from "~/graphql/index.js";
import type { TenantItem } from "~/types.js";

interface Params {
    onSaved: () => void;
}

interface UpdateTenantCallable {
    (tenant: TenantItem): Promise<void>;
}

export function useTenant({ onSaved }: Params) {
    const { tenant } = useTenancy();
    const { data, loading } = useQuery(GET_TENANT, { variables: { id: tenant } });
    const [updateTenant, updateMutation] = useMutation(UPDATE_TENANT);
    const { showSnackbar } = useSnackbar();

    const update = useCallback<UpdateTenantCallable>(async ({ id, ...data }) => {
        await updateTenant({ variables: { id, data: omit(data, ["parent"]) } });
        showSnackbar(`Tenant settings updated!`);
        onSaved();
    }, []);

    return {
        loading,
        saving: updateMutation.loading,
        tenant: loading ? null : get(data, "tenancy.getTenant.data"),
        update
    };
}
