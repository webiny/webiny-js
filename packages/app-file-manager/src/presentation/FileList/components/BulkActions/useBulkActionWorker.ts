import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";
import type { FmFile } from "~/features/shared/types.js";
import { getFilesLabel } from "./BulkActionBar.js";

// Hook that bridges the new presenter-based selection with the Worker pattern.
const useWorker = () => {
    const { vm, actions } = useFileListPresenter();
    const { current: worker } = useRef(new Worker<FmFile>());

    // Derive selected file objects from the presenter's selection IDs and rows.
    const selectedFiles = useMemo(() => {
        const { selectedIds } = vm.list.selection;
        return vm.list.rows.filter(row => selectedIds.has(row.id));
    }, [vm.list.selection.selectedIds, vm.list.rows]);

    useEffect(() => {
        worker.items = selectedFiles;
    }, [selectedFiles.length]);

    // Reset selected items in both the presenter and the Worker.
    const resetItems = useCallback(() => {
        worker.items = [];
        actions.selection.deselectAll();
    }, []);

    // Reset results in Worker.
    const resetResults = useCallback(async () => {
        worker.resetResults();
    }, []);

    return {
        items: selectedFiles,
        process: (callback: (items: FmFile[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<FmFile>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        resetItems,
        results: worker.results,
        resetResults
    };
};

// Compose the BulkAction utilities for the new v2 architecture.
export const BulkAction = {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
};

export { getFilesLabel };
