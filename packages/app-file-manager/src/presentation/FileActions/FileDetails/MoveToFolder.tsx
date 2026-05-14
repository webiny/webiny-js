import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { FileManagerViewConfig, useFile, useMoveFileToFolder } from "~/index.js";

const { FileDetails } = FileManagerViewConfig;

export const MoveToFolder = () => {
    const { file } = useFile();
    const moveToFolder = useMoveFileToFolder(file);

    return <FileDetails.Action.Button label={"Move"} icon={<MoveIcon />} onAction={moveToFolder} />;
};
