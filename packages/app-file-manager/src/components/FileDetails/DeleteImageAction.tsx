import React from "react";
import mime from "mime";
import styled from "@emotion/styled";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { FileItem } from "@webiny/app-admin/types";
import { useSnackbar } from "@webiny/app-admin";
import { useFile, useFileManagerApi, useFileManagerView } from "~/index";

const isImage = (file: FileItem) => {
    const fileType = mime.getType(file && file.name);

    if (fileType) {
        return fileType.includes("image");
    }

    return false;
};

const Filename = styled.span`
    font-weight: bold;
`;

export const DeleteImageAction = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { deleteFile } = useFileManagerView();
    const { showSnackbar } = useSnackbar();

    if (!canEdit(file)) {
        return null;
    }

    const fileDeleteConfirmationProps = {
        title: "Delete file",
        message: file && (
            <span>
                You&apos;re about to delete file <Filename>{file.name}</Filename>.<br />
                Are you sure you want to continue?
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
