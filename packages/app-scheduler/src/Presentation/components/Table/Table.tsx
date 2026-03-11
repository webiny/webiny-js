import React, { useMemo } from "react";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useScheduler } from "~/Presentation/hooks/index.js";
import { LoadingActions, type SchedulerEntryTableRow } from "~/types.js";
import { useSchedulerListConfig } from "~/Presentation/configs/index.js";

export const Table = () => {
    const { vm, selectItems, sortItems } = useScheduler();
    const { browser } = useSchedulerListConfig();

    const data = useMemo<SchedulerEntryTableRow[]>(() => {
        return createRecordsData(vm.items);
    }, [vm.items]);

    const selected = useMemo<SchedulerEntryTableRow[]>(() => {
        return createRecordsData(vm.selectedItems);
    }, [vm.selectedItems]);

    return (
        <AcoTable<SchedulerEntryTableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.loading[LoadingActions.list]}
            onSelectRow={entries => selectItems(entries.map(entry => entry.data))}
            sorting={vm.sorting}
            onSortingChange={sort => sortItems(sort)}
            selected={selected}
            nameColumnId={vm.nameColumnId}
            namespace={"scheduler/list"}
        />
    );
};
