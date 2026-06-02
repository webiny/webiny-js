import React, { useCallback, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { makeDecoratable, useButtons, useDialogWithReport, useListView, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useCms, useModel } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import merge from "lodash/merge.js";

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

export interface ProcessInBulkParams {
    action: string;
    where?: Record<string, any>;
    data?: Record<string, any>;
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
    const { list, actions: listActions } = useListView();
    const presenter = useContentEntriesPresenter();
    const { bulkAction } = useCms();
    const { current: worker } = useRef(new Worker<CmsContentEntry>());

    const selectedIds = Array.from(list.selection.selectedIds);
    const selected = presenter.listPresenter.vm.rows.filter(row =>
        list.selection.selectedIds.has(row.id)
    );
    const isSelectedAll = list.selection.allSelected;

    const resetItems = useCallback(() => {
        listActions.selection.deselectAll();
    }, []);

    return {
        items: selected,
        process: (callback: (items: CmsContentEntry[]) => void) =>
            worker.process(selected, callback),
        processInSeries: async (
            callback: ({
                item,
                allItems,
                report
            }: CallbackParams<CmsContentEntry>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(selected, callback, chunkSize),
        processInBulk: async ({ action, where: initialWhere, data }: ProcessInBulkParams) => {
            const where = merge(
                {
                    id_in: selectedIds
                },
                initialWhere
            );
            await bulkAction({ model, action, where, search: list.search, data });
        },
        resetItems,
        results: worker.results,
        isSelectedAll
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
