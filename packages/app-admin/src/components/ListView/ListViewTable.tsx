import { useMemo } from "react";
import { useListView } from "./context.js";

export interface UseListViewTablePropsOptions {
    namespace: string;
    nameColumnId?: string;
}

export function useListViewTableProps({ namespace, nameColumnId }: UseListViewTablePropsOptions) {
    const { list, actions } = useListView();

    const sorting = useMemo(() => {
        if (!list.sort) {
            return [];
        }
        return [{ id: list.sort.field, desc: list.sort.direction === "DESC" }];
    }, [list.sort]);

    return {
        loading: list.pagination.loading,
        sorting,
        onSortingChange: (updater: any) => {
            const newSorting = typeof updater === "function" ? updater(sorting) : updater;
            if (newSorting.length > 0) {
                actions.sort.set(newSorting[0].id, newSorting[0].desc ? "DESC" : "ASC");
            }
        },
        onSelectRow: (documents: Array<{ id: string }>) => {
            actions.selection.selectRows(documents.map(d => d.id));
        },
        selectedIds: list.selection.selectedIds,
        namespace,
        nameColumnId
    };
}
