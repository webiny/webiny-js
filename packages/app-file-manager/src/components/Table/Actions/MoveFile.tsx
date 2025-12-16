import React from "react";
import { ReactComponent as Move } from "@webiny/icons/drive_file_move.svg";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { useFile } from "~/hooks/useFile.js";
import { useMoveFileToFolder } from "~/hooks/useMoveFileToFolder.js";

export const MoveFile = () => {
    const { file } = useFile();
    const moveFileToFolder = useMoveFileToFolder(file);
    const { OptionsMenuItem } = FileManagerViewConfig.Browser.File.Action;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveFileToFolder}
            data-testid={"aco.actions.file.move"}
        />
    );
};
