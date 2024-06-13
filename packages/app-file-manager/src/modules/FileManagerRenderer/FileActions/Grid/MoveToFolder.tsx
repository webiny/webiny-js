import React from "react";
import { ReactComponent as MoveIcon } from "@material-design-icons/svg/filled/drive_file_move.svg";
import { FileManagerViewConfig, useFile, useMoveFileToFolder } from "~/index";

const { Browser } = FileManagerViewConfig;

export const MoveToFolder = () => {
    const { file } = useFile();
    const moveToFolder = useMoveFileToFolder(file);

    return <Browser.Grid.Item.Action.IconButton icon={<MoveIcon />} onAction={moveToFolder} />;
};
