import React from "react";
import type { FilesRenderChildren } from "react-butterfiles";

import { useFileManagerApi } from "~/index.js";
import { NoPermissions } from "~/presentation/FileList/components/NoPermissions/index.js";
import { NoResults } from "~/presentation/FileList/components/NoResults/index.js";
import { FileDropArea } from "~/presentation/FileList/components/FileDropArea/index.js";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
    isSearchResult?: boolean;
}

export const Empty = ({ browseFiles, isSearchResult }: EmptyViewProps) => {
    const { canRead } = useFileManagerApi();

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
