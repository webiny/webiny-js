import React from "react";
import { FilesRenderChildren } from "react-butterfiles";

import { useFileManagerApi } from "~/index";
import { NoPermission } from "~/components/NoPermission";
import { NoResults } from "~/components/NoResults";
import { DropFilesHere } from "~/components/DropFilesHere";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
    isSearchResult?: boolean;
}

export const Empty = ({ browseFiles, isSearchResult }: EmptyViewProps) => {
    const { canRead } = useFileManagerApi();

    if (!canRead) {
        return <NoPermission />;
    }
    if (isSearchResult) {
        return <NoResults />;
    }

    return <DropFilesHere empty onClick={() => browseFiles()} />;
};
