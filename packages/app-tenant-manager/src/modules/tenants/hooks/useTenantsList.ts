import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_TENANTS, DELETE_TENANT } from "~/graphql";
import { useCurrentTenantId } from "./useCurrentTenantId";

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

interface UseTenantsListHook {
    (config: Config): {
        loading: boolean;
        tenants: Array<{
            id: string;
            name: boolean;
            description: string;
            parent: string;
            [key: string]: any;
        }>;
        currentTenantId: string;
        createTenant: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        editTenant: (id: string) => void;
        deleteTenant: (id: string) => void;
    };
}

export const useTenantsList: UseTenantsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorter : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(defaultSorter);
    const { history } = useRouter();
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
        ({ name }) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortTenantList = useCallback(
        tenants => {
            if (!sort) {
                return tenants;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(tenants, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.tenancy.listTenants.data;

    const deleteTenant = useCallback(
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
                    history.push(`/tenants`);
                }
            });
        },
        [currentTenantId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const filteredData = filter === "" ? data : data.filter(filterTenants);
    const tenants = sortTenantList(filteredData);

    const createTenant = useCallback(() => history.push("/tenants?new=true"), []);

    const editTenant = useCallback(id => {
        history.push(`/tenants?id=${id}`);
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
