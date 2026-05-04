import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { useFile } from "~/hooks/useFile.js";

export const EditFile = () => {
    const { file } = useFile();
    const { actions } = useFileManagerPresenter();
    const { OptionsMenuItem } = FileManagerViewConfig.Browser.File.Action;

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => actions.showFileDetails(file.id)}
            data-testid={"aco.actions.file.edit"}
        />
    );
};
