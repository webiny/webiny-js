import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { TrashBinItemDTO, TrashBinPresenterViewModel } from "@webiny/app-trash-bin-common";
import { ITrashBinControllers } from "~/components/TrashBin/abstractions";

export interface TableProps {
    vm: TrashBinPresenterViewModel;
    controllers: ITrashBinControllers;
}

export const Table = (props: TableProps) => {
    return (
        <AcoTable<TrashBinItemDTO>
            data={props.vm.entries}
            loading={props.vm.loading["LIST"] || props.vm.loading["INIT"]}
            onSelectRow={entries => props.controllers.selectItems.execute(entries)}
            sorting={props.vm.sorting}
            onSortingChange={sort => props.controllers.sortItems.execute(sort)}
            selected={props.vm.selectedEntries}
            namespace={"trash-bin"}
        />
    );
};
