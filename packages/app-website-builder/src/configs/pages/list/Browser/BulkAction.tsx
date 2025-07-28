import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { CallbackParams, useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useDocumentList } from "~/modules/pages/PagesList/useDocumentList.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import { Page, type PageDto, PageDtoMapper } from "~/domain/Page/index.js";
import type { DocumentDto } from "~/modules/pages/PagesList/presenters/index.js";

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
    const { vm } = useDocumentList();
    const { selectPages } = useSelectPages<DocumentDto>();
    const { current: worker } = useRef(new Worker<PageDto>());

    const items = useMemo(() => {
        const pages = vm.selected.map(item => Page.create(item.data));
        return pages.map(page => PageDtoMapper.toDTO(page));
    }, [vm.selected]);

    useEffect(() => {
        worker.items = items;
    }, [items.length]);

    // Reset selected items in both useDocumentList and Worker
    const resetItems = useCallback(() => {
        worker.items = [];
        selectPages([]);
    }, []);

    // Reset results in Worker
    const resetResults = useCallback(async () => {
        worker.resetResults();
    }, []);

    return {
        items,
        process: (callback: (pages: PageDto[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<PageDto>) => Promise<void>,
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
