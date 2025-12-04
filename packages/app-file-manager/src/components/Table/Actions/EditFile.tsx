import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { useFile } from "~/hooks/useFile.js";

export const EditFile = () => {
    const { file } = useFile();
    const { showFileDetails } = useFileManagerView();
    const { OptionsMenuItem } = FileManagerViewConfig.Browser.File.Action;

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => showFileDetails(file.id)}
            data-testid={"aco.actions.file.edit"}
        />
    );
};
