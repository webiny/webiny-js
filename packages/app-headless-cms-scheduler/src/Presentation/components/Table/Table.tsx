import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { useScheduler } from "~/Presentation/hooks";
import type { SchedulerItem } from "~/Domain";
import { LoadingActions } from "~/types";

export const Table = () => {
    const { vm, selectItems, sortItems } = useScheduler();

    return (
        <AcoTable<SchedulerItem>
            data={vm.items}
            loading={vm.loading[LoadingActions.list]}
            onSelectRow={entries => selectItems(entries)}
            sorting={vm.sorting}
            onSortingChange={sort => sortItems(sort)}
            selected={vm.selectedItems}
            nameColumnId={vm.nameColumnId}
            namespace={"scheduler"}
        />
    );
};
