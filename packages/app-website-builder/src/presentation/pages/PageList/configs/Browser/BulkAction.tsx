import React, { useCallback, useMemo, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useDocumentList } from "~/presentation/pages/PageList/components/useDocumentList.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import { Page, type PageDto, PageDtoMapper } from "~/domain/Page/index.js";
import type { TableRow } from "~/presentation/pages/PageList/types.js";
import { makeDecoratable } from "@webiny/react-composition";

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

export const BaseBulkAction = makeDecoratable(
    "BulkAction",
    ({ name, after = undefined, before = undefined, remove = false, element }: BulkActionProps) => {
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
    }
);

const useWorker = () => {
    const { vm } = useDocumentList();
    const { selectPages } = useSelectPages<TableRow>();
    const { current: worker } = useRef(new Worker<PageDto>());

    const items = useMemo(() => {
        const pages = vm.selected.map(item => Page.create(item.data));
        return pages.map(page => PageDtoMapper.toDTO(page));
    }, [vm.selected]);

    const resetItems = useCallback(() => {
        selectPages([]);
    }, []);

    const resetResults = useCallback(async () => {
        worker.resetResults();
    }, []);

    return {
        items,
        process: (callback: (pages: PageDto[]) => void) => worker.process(items, callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<PageDto>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(items, callback, chunkSize),
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
