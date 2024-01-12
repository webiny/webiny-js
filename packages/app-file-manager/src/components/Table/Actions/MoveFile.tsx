import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useFile } from "~/hooks/useFile";
import { useMoveFileToFolder } from "~/hooks/useMoveFileToFolder";

export const MoveFile = () => {
    const { file } = useFile();
    const moveFileToFolder = useMoveFileToFolder(file);
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveFileToFolder}
            data-testid={"aco.actions.file.move"}
        />
    );
};
