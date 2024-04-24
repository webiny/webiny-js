import React from "react";
import { ReactComponent as MoveFileIcon } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { FileManagerViewConfig, useFile, useMoveFileToFolder } from "~/index";

const { FileDetails } = FileManagerViewConfig;

export const MoveToFolder = () => {
    const { file } = useFile();
    const moveToFolder = useMoveFileToFolder(file);

    return (
        <FileDetails.Action.IconButton
            label={"Move To Folder"}
            icon={<MoveFileIcon style={{ margin: "0 8px 0 0" }} />}
            onAction={moveToFolder}
        />
    );
};
