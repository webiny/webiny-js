import React from "react";
import mime from "mime";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { FileItem } from "@webiny/app-admin/types";
import { useFile, useFileManagerApi } from "~/index";
import { useDeleteFile } from "~/modules/Hooks/useDeleteFile";

interface DeleteImageActionProps {
    onDelete?: () => void;
}

const isImage = (file: FileItem) => {
    const fileType = mime.getType(file && file.name);

    if (fileType) {
        return fileType.includes("image");
    }

    return false;
};

export const DeleteImageAction = ({ onDelete }: DeleteImageActionProps) => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { openDialogDeleteFile } = useDeleteFile({
        file,
        onDelete
    });

    if (!canEdit(file)) {
        return null;
    }

    return (
        <Tooltip
            content={isImage(file) ? <span>Delete image</span> : <span>Delete file</span>}
            placement={"bottom"}
        >
            <IconButton
                data-testid={"fm-delete-file-button"}
                icon={<DeleteIcon style={{ margin: "0 8px 0 0" }} />}
                onClick={openDialogDeleteFile}
            />
        </Tooltip>
    );
};
