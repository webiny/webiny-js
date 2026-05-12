// @ts-nocheck
import React from "react";
import { ReactComponent as Move } from "@webiny/icons/drive_file_move.svg";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useMoveFileToFolder } from "~/presentation/hooks/useMoveFileToFolder.js";

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
