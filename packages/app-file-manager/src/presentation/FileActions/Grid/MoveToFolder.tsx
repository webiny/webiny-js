import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { FileManagerViewConfig, useFile, useMoveFileToFolder } from "~/index.js";

const { Browser } = FileManagerViewConfig;

export const MoveToFolder = () => {
    const { file } = useFile();
    const moveToFolder = useMoveFileToFolder(file);

    return (
        <Browser.Grid.Item.Action.IconButton
            label={"Move file"}
            icon={<MoveIcon />}
            onAction={moveToFolder}
        />
    );
};
