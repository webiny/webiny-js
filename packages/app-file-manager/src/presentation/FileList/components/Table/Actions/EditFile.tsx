// @ts-nocheck
import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { useFile } from "~/presentation/hooks/useFile.js";

export const EditFile = () => {
    const { file } = useFile();
    const { showFileDetails } = useFileManagerView();
    const { OptionsMenuItem } = FileManagerViewConfig.Browser.FileAction;

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => showFileDetails(file.id)}
            data-testid={"aco.actions.file.edit"}
        />
    );
};
