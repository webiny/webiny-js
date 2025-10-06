import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty.js";
import omit from "lodash/omit.js";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { useRoute, useRouter, useSnackbar } from "@webiny/app-admin";
import { CREATE_TENANT, GET_TENANT, UPDATE_TENANT, LIST_TENANTS } from "~/graphql/index.js";
import type { TenantItem } from "~/types.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-tenant-manager/tenants/form");

export const useTenantForm = () => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Tenants.List);
    const { showSnackbar } = useSnackbar();
    const id = route.params.id;
    const newTenant = route.params.new === true;

    const getQuery = useQuery(GET_TENANT, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = get(data, "tenancy.getTenant.error");
            if (error) {
                goToRoute(Routes.Tenants.List);
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

            if (!id) {
                goToRoute(Routes.Tenants.List, { id: tenant.id });
            }
            showSnackbar(t`Tenant was saved successfully.`);
        },
        [id]
    );

    const tenant = get(getQuery, "data.tenancy.getTenant.data");

    const showEmptyView = !id && !loading && isEmpty(tenant) && !newTenant;

    const createTenant = useCallback(() => {
        goToRoute(Routes.Tenants.List, { new: true });
    }, []);

    const cancelEditing = useCallback(() => {
        goToRoute(Routes.Tenants.List);
    }, []);

    return {
        loading,
        showEmptyView,
        createTenant,
        cancelEditing,
        tenant,
        onSubmit
    };
};
