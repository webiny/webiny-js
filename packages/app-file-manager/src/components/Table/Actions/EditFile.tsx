import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { useFile } from "~/hooks/useFile";

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
