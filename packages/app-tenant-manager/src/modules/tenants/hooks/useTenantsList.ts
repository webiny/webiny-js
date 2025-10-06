import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { useConfirmationDialog, useRouter, useSnackbar } from "@webiny/app-admin";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { DELETE_TENANT, LIST_TENANTS } from "~/graphql/index.js";
import { useCurrentTenantId } from "./useCurrentTenantId.js";
import type { TenantItem } from "~/types.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-tenant-manager/tenants/data-list");

type SortTypes = "asc" | "desc";
export const deserializeSorters = (data: string): [string, SortTypes] => {
    if (typeof data !== "string") {
        return data;
    }
    const [field, orderBy] = data.split("_") as [string, SortTypes];
    const order = String(orderBy).toLowerCase() === "asc" ? "asc" : "desc";
    return [field, order];
};

interface Sorter {
    label: string;
    sorter: string;
}
interface Config {
    sorters: Sorter[];
}

interface DeleteTenantCallable {
    (item: Pick<TenantItem, "id" | "name">): void;
}

interface UseTenantsListHook {
    (config: Config): {
        loading: boolean;
        tenants: Array<{
            id: string;
            name: string;
            description: string;
            parent: string | null;
            [key: string]: any;
        }>;
        currentTenantId: string | null;
        createTenant: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string | null;
        setSort: (sort: string) => void;
        editTenant: (id: string) => void;
        deleteTenant: DeleteTenantCallable;
    };
}

export const useTenantsList: UseTenantsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorter : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string | null>(defaultSorter);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_TENANTS);
    const currentTenantId = useCurrentTenantId();
    const [deleteIt, deleteMutation] = useMutation(DELETE_TENANT, {
        refetchQueries: [{ query: LIST_TENANTS }]
    });

    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const filterTenants = useCallback(
        ({ name }: Pick<TenantItem, "name">) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortTenantList = useCallback(
        (tenants: TenantItem[]): TenantItem[] => {
            if (!sort) {
                return tenants;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(tenants, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.tenancy.listTenants.data;

    const deleteTenant = useCallback<DeleteTenantCallable>(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: { id: item.id }
                });

                const { error } = response.data.tenancy.deleteTenant;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Tenant "{name}" deleted.`({ name: item.name }));

                if (currentTenantId === item.id) {
                    goToRoute(Routes.Tenants.List);
                }
            });
        },
        [currentTenantId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const filteredData = filter === "" ? data : data.filter(filterTenants);
    const tenants = sortTenantList(filteredData);

    const createTenant = useCallback(() => {
        console.log("goToRoute", Routes.Tenants.List);
        goToRoute(Routes.Tenants.List, { new: true });
    }, []);

    const editTenant = useCallback((id: string) => {
        goToRoute(Routes.Tenants.List, { id });
    }, []);

    return {
        tenants,
        loading,
        currentTenantId,
        createTenant,
        filter,
        setFilter,
        sort,
        setSort,
        editTenant,
        deleteTenant
    };
};
