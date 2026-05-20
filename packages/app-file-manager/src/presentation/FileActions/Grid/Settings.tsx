import React, { useCallback } from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

const { Browser } = FileManagerViewConfig;

export const Settings = () => {
    const { file } = useFile();
    const { actions } = useFileManagerPresenter();

    const showDetails = useCallback(() => {
        actions.showFileDetails(file.id);
    }, [file.id]);

    return (
        <Browser.Grid.Item.Action.IconButton
            icon={<EditIcon />}
            label={"Edit file details"}
            onAction={showDetails}
            data-testid={"fm-file-wrapper-file-info-icon"}
        />
    );
};
