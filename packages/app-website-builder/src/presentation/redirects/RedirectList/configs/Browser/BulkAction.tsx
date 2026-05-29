import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { type RedirectDto, RedirectDtoMapper } from "~/domain/Redirect/index.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";

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
    const { vm, actions } = useRedirectListPresenter();
    const { current: worker } = useRef(new Worker<RedirectDto>());

    const items = useMemo(() => {
        const selectedIds = vm.list.selection.selectedIds;
        return vm.list.rows.filter(r => selectedIds.has(r.id)).map(r => RedirectDtoMapper.toDTO(r));
    }, [vm.list.selection.selectedIds, vm.list.rows]);

    useEffect(() => {
        worker.items = items;
    }, [items.length]);

    const resetItems = useCallback(() => {
        worker.items = [];
        actions.selection.deselectAll();
    }, []);

    // Reset results in Worker
    const resetResults = useCallback(async () => {
        worker.resetResults();
    }, []);

    return {
        items,
        process: (callback: (redirects: RedirectDto[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<RedirectDto>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        resetItems: resetItems,
        results: worker.results,
        resetResults
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
