import React, { useCallback, useEffect, useRef } from "react";
import {
    CallbackParams,
    makeDecoratable,
    useButtons,
    useDialogWithReport,
    Worker
} from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useCms, useContentEntriesList, useModel } from "~/admin/hooks";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export interface BulkActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface BulkActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    modelIds?: string[];
    element?: React.ReactElement;
}

export const BaseBulkAction = makeDecoratable(
    "BulkAction",
    ({
        name,
        after = undefined,
        before = undefined,
        remove = false,
        modelIds = [],
        element
    }: BulkActionProps) => {
        const { model } = useModel();
        const getId = useIdGenerator("bulkAction");

        if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
            return null;
        }

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
    }
);

const useWorker = () => {
    const { model } = useModel();
    const { selected, setSelected, where, isSelectedAll, selectedLength } = useContentEntriesList();
    const { bulkAction } = useCms();
    const { current: worker } = useRef(new Worker<CmsContentEntry>());

    useEffect(() => {
        worker.items = selected;
    }, [selected.length]);

    // Reset selected items in both useContentEntriesList and Worker
    const resetItems = useCallback(() => {
        worker.items = [];
        setSelected([]);
    }, []);

    return {
        items: selected,
        process: (callback: (items: CmsContentEntry[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({
                item,
                allItems,
                report
            }: CallbackParams<CmsContentEntry>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        processInBulk: async (action: string, data?: Record<string, any>) => {
            await bulkAction({ model, action, where, data });
        },
        resetItems: resetItems,
        results: worker.results,
        isSelectedAll,
        selectedLength
    };
};

const useBulkWorker = () => {
    const { model } = useModel();
    const { where } = useContentEntriesList();
    const { bulkAction } = useCms();

    return {
        process: async (action: string, data: Record<string, any>) =>
            bulkAction({ model, action, where, data })
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useBulkWorker,
    useDialog: useDialogWithReport
});
