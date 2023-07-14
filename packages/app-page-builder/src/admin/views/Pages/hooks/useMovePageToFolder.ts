import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog, useRecords } from "@webiny/app-aco";
import { PbPageDataItem } from "~/types";
import { Location } from "@webiny/app-aco/types";

interface UseMovePageToFolderParams {
    record: PbPageDataItem;
    location: Location;
}

export function useMovePageToFolder({ record, location }: UseMovePageToFolderParams) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const { moveRecord } = useRecords();

    return useCallback(() => {
        showDialog({
            title: "Move page to a new location",
            message: "Select a new location for this page:",
            loadingLabel: "Moving page...",
            acceptLabel: "Move page",
            focusedFolderId: location.folderId,
            async onAccept({ folder }) {
                await moveRecord({
                    id: record.pid,
                    location: {
                        folderId: folder.id
                    }
                });
                showSnackbar(
                    `Page "${record.title}" was successfully moved to folder "${folder.title}"!`
                );
            }
        });
    }, [record.pid]);
}
