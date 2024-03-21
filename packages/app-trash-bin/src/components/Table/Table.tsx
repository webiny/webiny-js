import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import {
    ITrashBinControllers,
    TrashBinPresenterViewModel
} from "~/components/TrashBin/abstractions";
import { LoadingEnum } from "~/types";

export interface TableProps {
    vm: TrashBinPresenterViewModel;
    controllers: ITrashBinControllers;
}

export const Table = (props: TableProps) => {
    return (
        <AcoTable<TrashBinItemDTO>
            data={props.vm.items}
            loading={props.vm.loading[LoadingEnum.init] || props.vm.loading[LoadingEnum.list]}
            onSelectRow={entries => props.controllers.selectItems.execute(entries)}
            sorting={props.vm.sorting}
            onSortingChange={sort => props.controllers.sortItems.execute(sort)}
            selected={props.vm.selectedItems}
            namespace={"trash-bin"}
        />
    );
};
