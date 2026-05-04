import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { OverlayLoader, Text } from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { DeleteFileUseCase } from "~/features/deleteFile/abstractions.js";
import type { FileItem } from "~/types.js";

const t = i18n.ns("app-admin/file-manager/hooks/use-delete-file");

interface UseDeleteFileParams {
    file: Pick<FileItem, "id" | "name">;
    onDelete?: () => void;
}

export const useDeleteFile = ({ onDelete, file }: UseDeleteFileParams) => {
    const container = useContainer();
    const deleteFileUseCase = container.resolve(DeleteFileUseCase);
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete file`,
        loading: <OverlayLoader text={"Deleting file..."} />,
        message: file && (
            <>
                <Text>
                    {t`You are about to delete file {name}. Are you sure you want to continue?`({
                        name: <strong>{file.name}</strong>
                    })}
                </Text>
            </>
        ),
        dataTestId: "fm-delete-file-confirmation-dialog"
    });

    const openDialogDeleteFile = useCallback(
        () =>
            showConfirmation(async () => {
                await deleteFileUseCase.execute({ id: file.id });

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
