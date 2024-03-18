import React, { useCallback, useEffect, useRef } from "react";
import { CallbackParams, useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useTrashBin } from "~/hooks";
import { TrashBinEntryDTO } from "@webiny/app-trash-bin-common";

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
    const { presenter, controller } = useTrashBin();
    const { current: worker } = useRef(new Worker<TrashBinEntryDTO>());

    useEffect(() => {
        worker.items = presenter.vm.selectedEntries;
    }, [presenter.vm.selectedEntries.length]);

    // Reset selected items in both useContentEntriesList and Worker
    const resetItems = useCallback(() => {
        worker.items = [];
        controller.selectEntries([]);
    }, []);

    return {
        items: presenter.vm.selectedEntries,
        process: (callback: (items: TrashBinEntryDTO[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({
                item,
                allItems,
                report
            }: CallbackParams<TrashBinEntryDTO>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        resetItems: resetItems,
        results: worker.results
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
