import React, { useMemo } from "react";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useWbScheduler } from "~/Presentation/hooks/index.js";
import { LoadingActions, type WbSchedulerEntryTableRow } from "~/types.js";
import { useWbSchedulerListConfig } from "~/Presentation/configs/index.js";

export const Table = () => {
    const { vm, selectItems, sortItems } = useWbScheduler();
    const { browser } = useWbSchedulerListConfig();

    const data = useMemo<WbSchedulerEntryTableRow[]>(() => {
        return createRecordsData(vm.items);
    }, [vm.items]);

    const selected = useMemo<WbSchedulerEntryTableRow[]>(() => {
        return createRecordsData(vm.selectedItems);
    }, [vm.selectedItems]);

    return (
        <AcoTable<WbSchedulerEntryTableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.loading[LoadingActions.list]}
            onSelectRow={entries => selectItems(entries.map(entry => entry.data))}
            sorting={vm.sorting}
            onSortingChange={sort => sortItems(sort)}
            selected={selected}
            nameColumnId={vm.nameColumnId}
            namespace={"wb-scheduler/list"}
        />
    );
};
