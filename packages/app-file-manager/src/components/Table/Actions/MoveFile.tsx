import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { useFile } from "~/hooks/useFile";
import { useMoveFileToFolder } from "~/hooks/useMoveFileToFolder";

export const MoveFile = () => {
    const { file } = useFile();
    const moveFileToFolder = useMoveFileToFolder(file);
    const { OptionsMenuItem } = FileManagerViewConfig.Browser.FileAction;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveFileToFolder}
            data-testid={"aco.actions.file.move"}
        />
    );
};
