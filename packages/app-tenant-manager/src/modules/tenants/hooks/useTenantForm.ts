import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_TENANT, GET_TENANT, UPDATE_TENANT, LIST_TENANTS } from "~/graphql";
import { TenantItem } from "~/types";

const t = i18n.ns("app-tenant-manager/tenants/form");

export const useTenantForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const id = new URLSearchParams(location.search).get("id");
    const newTenant = new URLSearchParams(location.search).get("new");

    const getQuery = useQuery(GET_TENANT, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = get(data, "tenancy.getTenant.error");
            if (error) {
                history.push("/tenants");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_TENANT, {
        refetchQueries: [{ query: LIST_TENANTS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_TENANT, {
        refetchQueries: [{ query: LIST_TENANTS }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async (data: TenantItem) => {
            const [operation, args] = id
                ? [update, { variables: { id: data.id, data: omit(data, ["id", "parent"]) } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const { data: tenant, error } = response.data.tenancy.tenant;
            if (error) {
                return showSnackbar(error.message);
            }

            !id && history.push(`/tenants?id=${tenant.id}`);
            showSnackbar(t`Tenant was saved successfully.`);
        },
        [id]
    );

    const tenant = get(getQuery, "data.tenancy.getTenant.data");

    const showEmptyView = !id && !loading && isEmpty(tenant) && !newTenant;
    const createTenant = useCallback(() => history.push("/tenants?new=true"), []);
    const cancelEditing = useCallback(() => history.push("/tenants"), []);

    return {
        loading,
        showEmptyView,
        createTenant,
        cancelEditing,
        tenant,
        onSubmit
    };
};
