import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileItem } from "@webiny/app-admin/types";
import { useRecords } from "@webiny/app-aco";
import styled from "@emotion/styled";

const t = i18n.ns("app-admin/file-manager/file-manager-view/hooks/file/delete");

interface UseDeleteFileParams {
    file: Pick<FileItem, "id" | "name">;
    onDelete?: () => void;
}

const Filename = styled("span")`
    font-weight: bold;
`;

export const useDeleteFile = ({ onDelete, file }: UseDeleteFileParams) => {
    const { deleteFile } = useFileManagerView();
    const { showSnackbar } = useSnackbar();
    const { getRecord } = useRecords();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete file`,
        message: file && (
            <>
                <p>
                    {t`You are about to delete file {name}`({
                        name: <Filename>{file.name}</Filename>
                    })}
                </p>
                <p>{t`Are you sure you want to continue?`}</p>
            </>
        ),
        style: { zIndex: 100 },
        dataTestId: "fm-delete-file-confirmation-dialog"
    });

    const openDialogDeleteFile = useCallback(
        () =>
            showConfirmation(async () => {
                await deleteFile(file.id);

                // Sync ACO record - retrieve the most updated record from network
                await getRecord(file.id);

                showSnackbar(t`File deleted successfully`);

                if (typeof onDelete === "function") {
                    onDelete();
                }
            }),
        [file]
    );

    return {
        openDialogDeleteFile
    };
};
