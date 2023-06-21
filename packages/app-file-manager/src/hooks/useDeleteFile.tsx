import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import { useFileManagerView } from "~/index";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-admin/file-manager/hooks/use-delete-file");

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

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete file`,
        loading: <CircularProgress label={"Deleting file..."} />,
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

                showSnackbar(t`File deleted successfully.`);

                if (onDelete && typeof onDelete === "function") {
                    onDelete();
                }
            }),
        [file]
    );

    return {
        openDialogDeleteFile
    };
};
