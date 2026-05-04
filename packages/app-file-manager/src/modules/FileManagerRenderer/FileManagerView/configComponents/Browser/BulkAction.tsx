import React, { useCallback, useEffect, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import type { FileItem } from "~/types.js";

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
    const { vm, actions } = useFileManagerPresenter();
    const { current: worker } = useRef(new Worker<FileItem>());

    const selected = vm.list.rows.filter(f => vm.list.selection.selectedIds.has(f.id));

    useEffect(() => {
        worker.items = selected;
    }, [selected.length]);

    const resetItems = useCallback(() => {
        worker.items = [];
        actions.selection.deselectAll();
    }, []);

    return {
        items: selected,
        process: (callback: (items: FileItem[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<FileItem>) => Promise<void>,
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
