import React, { useCallback, useRef } from "react";
import type { CallbackParams } from "~/components/BulkActions/index.js";
import { useButtons, useDialogWithReport, Worker } from "~/index.js";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useTrashBinPresenter } from "../../hooks/useTrashBinPresenter.js";
import type { TrashBinItem } from "../../abstractions.js";

export interface BulkActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface BulkActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    element?: React.ReactElement;
}

export const BaseBulkAction = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
}: BulkActionProps) => {
    const getId = useIdGenerator("bulkAction");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="browser" name={"browser"}>
            <Property
                id={getId(name)}
                name={"bulkActions"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                {element ? (
                    <Property id={getId(name, "element")} name={"element"} value={element} />
                ) : null}
            </Property>
        </Property>
    );
};

const useWorker = () => {
    const { vm, actions } = useTrashBinPresenter();
    const { current: worker } = useRef(new Worker<TrashBinItem>());

    const resetItems = useCallback(() => {
        actions.selection.deselectAll();
    }, [actions]);

    const selectedItems: TrashBinItem[] = vm.list.rows.filter(row =>
        vm.list.selection.selectedIds.has(row.id)
    );

    return {
        items: selectedItems,
        process: (callback: (items: TrashBinItem[]) => void) =>
            worker.process(selectedItems, callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<TrashBinItem>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(selectedItems, callback, chunkSize),
        processInBulk: async (
            callback: (params: {
                where?: Record<string, unknown>;
                search?: string;
            }) => Promise<void>
        ) => {
            await callback({ search: vm.list.search });
        },
        resetItems,
        results: worker.results,
        isSelectedAll: vm.list.selection.allSelected
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
