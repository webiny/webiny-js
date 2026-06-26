import { useCallback, useMemo, useRef } from "react";
import type { CallbackParams } from "@webiny/app-admin";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import type { FmFile } from "~/features/shared/types.js";
import { getFilesLabel } from "./BulkActionBar.js";

// Hook that bridges the new presenter-based selection with the Worker pattern.
const useWorker = () => {
    const { vm, actions } = useFileManagerPresenter();
    const { current: worker } = useRef(new Worker<FmFile>());

    const selectedFiles = useMemo(() => {
        const { selectedIds } = vm.list.selection;
        return vm.list.rows.filter(row => selectedIds.has(row.id));
    }, [vm.list.selection.selectedIds, vm.list.rows]);

    const resetItems = useCallback(() => {
        actions.selection.deselectAll();
    }, []);

    const resetResults = useCallback(async () => {
        worker.resetResults();
    }, []);

    return {
        items: selectedFiles,
        process: (callback: (items: FmFile[]) => void) => worker.process(selectedFiles, callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<FmFile>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(selectedFiles, callback, chunkSize),
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
