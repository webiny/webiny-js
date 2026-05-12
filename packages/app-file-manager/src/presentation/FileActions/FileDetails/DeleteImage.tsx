import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { FileManagerViewConfig, useFile, useFileManagerApi } from "~/index.js";
import { useDeleteFile } from "~/presentation/hooks/useDeleteFile.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

const { FileDetails } = FileManagerViewConfig;

export const DeleteImage = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { actions } = useFileManagerPresenter();
    const { openDialogDeleteFile } = useDeleteFile({
        file,
        onDelete: actions.hideFileDetails
    });

    if (!canEdit(file)) {
        return null;
    }

    return (
        <FileDetails.Action.Button
            label={"Delete"}
            onAction={openDialogDeleteFile}
            icon={<DeleteIcon />}
            data-testid={"fm-delete-file-button"}
        />
    );
};
