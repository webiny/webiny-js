import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { ITrashBinUseCases, TrashBinPresenterViewModel } from "~/components/TrashBin/abstractions";
import { LoadingActions } from "~/types";

export interface TableProps {
    vm: TrashBinPresenterViewModel;
    useCases: ITrashBinUseCases;
}

export const Table = (props: TableProps) => {
    return (
        <AcoTable<TrashBinItemDTO>
            data={props.vm.items}
            loading={props.vm.loading[LoadingActions.init] || props.vm.loading[LoadingActions.list]}
            onSelectRow={entries => props.useCases.selectItemsUseCase.execute(entries)}
            sorting={props.vm.sorting}
            onSortingChange={sort => props.useCases.sortItemsUseCase.execute(sort)}
            selected={props.vm.selectedItems}
            namespace={"trash-bin"}
        />
    );
};
