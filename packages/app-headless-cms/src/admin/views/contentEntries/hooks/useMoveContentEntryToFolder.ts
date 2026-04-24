import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog, useRecords } from "@webiny/app-aco";
import type { CmsContentEntry } from "~/types.js";

interface UseMoveContentEntryToFolder {
    record: CmsContentEntry;
}

export function useMoveContentEntryToFolder({ record }: UseMoveContentEntryToFolder) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const { moveRecord } = useRecords();

    return useCallback(() => {
        showDialog({
            title: "Move entry to a new location",
            message: "Select a new location for this entry:",
            loadingLabel: "Moving entry...",
            acceptLabel: "Move entry",
            focusedFolderId: record.wbyAco_location.folderId,
            async onAccept({ folder }) {
                await moveRecord({
                    id: record.id,
                    location: {
                        folderId: folder.id
                    }
                });
                showSnackbar(
                    `Entry "${record.meta?.title || "unknown"}" was successfully moved to folder "${folder.label}"!`
                );
            }
        });
    }, [record.id]);
}
