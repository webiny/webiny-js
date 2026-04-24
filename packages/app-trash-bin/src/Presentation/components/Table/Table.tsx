import React, { useMemo } from "react";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useTrashBin } from "~/Presentation/hooks/index.js";
import type { TrashBinTableRow } from "~/Domain/index.js";
import { LoadingActions } from "~/types.js";
import { useTrashBinListConfig } from "~/Presentation/configs/index.js";

export const Table = () => {
    const { vm, selectItems, sortItems } = useTrashBin();
    const { browser } = useTrashBinListConfig();

    const data = useMemo<TrashBinTableRow[]>(() => {
        return createRecordsData(vm.items);
    }, [vm.items]);

    const selected = useMemo<TrashBinTableRow[]>(() => {
        return createRecordsData(vm.selectedItems);
    }, [vm.selectedItems]);

    return (
        <AcoTable<TrashBinTableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.loading[LoadingActions.list]}
            onSelectRow={entries => selectItems(entries)}
            sorting={vm.sorting}
            onSortingChange={sort => sortItems(sort)}
            selected={selected}
            nameColumnId={vm.nameColumnId}
            namespace={"trash-bin/list"}
        />
    );
};
