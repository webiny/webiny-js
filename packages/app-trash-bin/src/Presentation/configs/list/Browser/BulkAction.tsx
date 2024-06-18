import React, { useCallback, useEffect, useRef } from "react";
import { CallbackParams, useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useTrashBin } from "~/Presentation/hooks";
import { TrashBinItemDTO } from "~/Domain";

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
    const { vm, selectItems, bulkAction } = useTrashBin();
    const { current: worker } = useRef(new Worker<TrashBinItemDTO>());

    useEffect(() => {
        worker.items = vm.selectedItems;
    }, [vm.selectedItems.length]);

    // Reset selected items in both repository and Worker
    const resetItems = useCallback(() => {
        worker.items = [];
        selectItems([]);
    }, []);

    return {
        items: vm.selectedItems,
        process: (callback: (items: TrashBinItemDTO[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({
                item,
                allItems,
                report
            }: CallbackParams<TrashBinItemDTO>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        processInBulk: async (action: string, data?: Record<string, any>) => {
            await bulkAction({ action, search: vm.searchQuery, data });
        },
        resetItems: resetItems,
        results: worker.results,
        isSelectedAll: vm.isSelectedAll
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
