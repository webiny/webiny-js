import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { useTrashBin } from "~/Presentation/hooks";
import { LoadingActions } from "~/types";

export const Table = () => {
    const { vm, selectItems, sortItems } = useTrashBin();

    return (
        <AcoTable<TrashBinItemDTO>
            data={vm.items}
            loading={vm.loading[LoadingActions.list]}
            onSelectRow={entries => selectItems(entries)}
            sorting={vm.sorting}
            onSortingChange={sort => sortItems(sort)}
            selected={vm.selectedItems}
            nameColumnId={vm.nameColumnId}
            namespace={"trash-bin"}
        />
    );
};
