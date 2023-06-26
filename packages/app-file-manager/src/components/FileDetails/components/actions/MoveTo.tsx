import React from "react";
import { ReactComponent as MoveFileIcon } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useFile, useMoveFileToFolder } from "~/index";

export const MoveTo = () => {
    const { file } = useFile();
    const moveToFolder = useMoveFileToFolder(file);

    return (
        <Tooltip content={<span>Move To Folder</span>} placement={"bottom"}>
            <IconButton
                onClick={moveToFolder}
                icon={<MoveFileIcon style={{ margin: "0 8px 0 0" }} />}
            />
        </Tooltip>
    );
};
