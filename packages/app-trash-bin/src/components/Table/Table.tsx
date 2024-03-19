import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import {
    ISortController,
    ITrashBinController,
    TrashBinEntryDTO,
    TrashBinPresenterViewModel
} from "@webiny/app-trash-bin-common";

export interface TableProps {
    vm: TrashBinPresenterViewModel;
    controller: ITrashBinController;
    sortController: ISortController;
}

export const Table = (props: TableProps) => {
    return (
        <AcoTable<TrashBinEntryDTO>
            data={props.vm.entries}
            loading={props.vm.loading["LIST"] || props.vm.loading["INIT"]}
            onSelectRow={entries => props.controller.selectEntries(entries)}
            sorting={props.vm.sorting}
            onSortingChange={sort => props.sortController.execute(sort)}
            selected={props.vm.selectedEntries}
            namespace={"trash-bin"}
        />
    );
};
