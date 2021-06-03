import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_TARGETS, DELETE_TARGET } from "./graphql";
import { useCurrentTarget } from "./useCurrentTarget";

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UseTargetsListHook {
    (config: Config): {
        loading: boolean;
        targets: Array<{
            id: string;
            default: boolean;
            createdOn: string;
            [key: string]: any;
        }>;
        currentTargetId: string;
        createTarget: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editTarget: (id: string) => void;
        deleteTarget: (id: string) => void;
    };
}

export const useTargetsList: UseTargetsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_TARGETS);
    const currentTargetId = useCurrentTarget();
    const [deleteIt, deleteMutation] = useMutation(DELETE_TARGET, {
        refetchQueries: [{ query: LIST_TARGETS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const sortTargetList = useCallback(
        targets => {
            if (!sort) {
                return targets;
            }
            const [[key, value]] = Object.entries(deserializeSorters(sort));
            return orderBy(targets, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.targets.listTargets.data;

    const deleteTarget = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const { error } = response.data.targets.deleteTarget;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(`Target "${item.id}" deleted.`);

                if (currentTargetId === item.id) {
                    history.push(`/targets`);
                }

                refetchTargets();
                // Reload page
                window.location.reload();
            });
        },
        [currentTargetId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const targets = sortTargetList(filteredData);

    const createTarget = useCallback(() => history.push("/targets?new=true"), []);

    const editTarget = useCallback(id => {
        history.push(`/targets?id=${id}`);
    }, []);

    return {
        targets,
        loading,
        currentTargetId,
        createTarget,
        filter,
        setFilter,
        sort,
        setSort,
        editTarget,
        deleteTarget
    };
};
