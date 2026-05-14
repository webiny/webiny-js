import React from "react";
import type { FilesRenderChildren } from "react-butterfiles";

import { NoPermissions } from "~/presentation/FileList/components/NoPermissions/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { NoResults } from "~/presentation/FileList/components/NoResults/index.js";
import { FileDropArea } from "~/presentation/FileList/components/FileDropArea/index.js";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
    isSearchResult?: boolean;
}

export const Empty = ({ browseFiles, isSearchResult }: EmptyViewProps) => {
    const { vm } = useFileManagerPresenter();
    const { canRead } = vm.permissions;

    if (!canRead) {
        return <NoPermissions />;
    }

    if (isSearchResult) {
        return <NoResults />;
    }

    return (
        <FileDropArea
            empty
            onClick={() => browseFiles()}
            title={"Drag & Drop files here"}
            description={
                "You can also upload files from your computer by clicking the button below"
            }
        />
    );
};
