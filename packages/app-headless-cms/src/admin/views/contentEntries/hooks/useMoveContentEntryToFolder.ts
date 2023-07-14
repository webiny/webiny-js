import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog, useRecords } from "@webiny/app-aco";
import { parseIdentifier } from "@webiny/utils";
import { RecordEntry } from "~/admin/components/ContentEntries/Table/types";

interface UseMoveContentEntryToFolder {
    record: RecordEntry;
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
            focusedFolderId: record.location.folderId,
            async onAccept({ folder }) {
                const { id } = parseIdentifier(record.id);
                await moveRecord({
                    id,
                    location: {
                        folderId: folder.id
                    }
                });
                showSnackbar(
                    `Entry "${record.title}" was successfully moved to folder "${folder.title}"!`
                );
            }
        });
    }, [record.id]);
}
