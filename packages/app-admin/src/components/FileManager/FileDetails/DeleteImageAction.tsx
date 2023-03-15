import React from "react";
import mime from "mime";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { useFile } from "~/components/FileManager/FileDetails/FileProvider";
import { FileItem } from "~/components/FileManager/types";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useFileManager } from "~/components/FileManager/FileManagerContext";
import { useSnackbar } from "~/hooks/useSnackbar";

const isImage = (file: FileItem) => {
    const fileType = mime.getType(file && file.name);

    if (fileType) {
        return fileType.includes("image");
    }

    return false;
};

export const DeleteImageAction = () => {
    const { file } = useFile();
    const { deleteFile, canEdit } = useFileManager();
    const { showSnackbar } = useSnackbar();

    if (!canEdit(file)) {
        return null;
    }

    const fileDeleteConfirmationProps = {
        title: "Delete file",
        message: file && (
            <span>
                You&apos;re about to delete file {file.name}. Are you sure you want to continue?
            </span>
        )
    };
    return (
        <ConfirmationDialog
            {...fileDeleteConfirmationProps}
            data-testid={"fm-delete-file-confirmation-dialog"}
            style={{ zIndex: 100 }}
        >
            {({ showConfirmation }) => {
                return (
                    <Tooltip
                        content={
                            isImage(file) ? <span>Delete image</span> : <span>Delete file</span>
                        }
                        placement={"bottom"}
                    >
                        <IconButton
                            data-testid={"fm-delete-file-button"}
                            icon={<DeleteIcon style={{ margin: "0 8px 0 0" }} />}
                            onClick={() =>
                                showConfirmation(async () => {
                                    await deleteFile(file.id);
                                    showSnackbar(`File deleted successfully.`);
                                })
                            }
                        />
                    </Tooltip>
                );
            }}
        </ConfirmationDialog>
    );
};
