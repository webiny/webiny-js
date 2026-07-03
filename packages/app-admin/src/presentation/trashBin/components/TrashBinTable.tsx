import React, { useMemo } from "react";
import { createRecordsData, Table as AcoTable } from "~/components/Table/index.js";
import type { TableRow } from "~/components/Table/table.types.js";
import { useTrashBinPresenter } from "../hooks/index.js";
import { useTrashBinListConfig } from "../configs/index.js";
import type { TrashBinItem } from "../abstractions.js";

type TrashBinTableRow = TableRow<TrashBinItem>;

export const TrashBinTable = () => {
    const { vm, actions } = useTrashBinPresenter();
    const { browser } = useTrashBinListConfig();

    const data = useMemo<TrashBinTableRow[]>(() => {
        return createRecordsData(vm.list.rows);
    }, [vm.list.rows]);

    const selected = useMemo<TrashBinTableRow[]>(() => {
        const selectedRows = vm.list.rows.filter(row => vm.list.selection.selectedIds.has(row.id));
        return createRecordsData(selectedRows);
    }, [vm.list.rows, vm.list.selection.selectedIds]);

    const sorting = useMemo(() => {
        if (!vm.list.sort) {
            return [];
        }
        return [
            {
                id: vm.list.sort.field,
                desc: vm.list.sort.direction === "DESC"
            }
        ];
    }, [vm.list.sort]);

    return (
        <AcoTable<TrashBinTableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.list.pagination.loading}
            onSelectRow={entries => {
                actions.selection.selectRows(entries.map(e => e.id));
            }}
            sorting={sorting}
            onSortingChange={newSorting => {
                const resolved =
                    typeof newSorting === "function" ? newSorting(sorting) : newSorting;
                if (resolved.length > 0) {
                    actions.sort.set(resolved[0].id, resolved[0].desc ? "DESC" : "ASC");
                }
            }}
            selected={selected}
            nameColumnId={vm.nameColumnId}
            namespace={"trash-bin/list"}
        />
    );
};
