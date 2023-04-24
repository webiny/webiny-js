import React from "react";
import { FilesRenderChildren } from "react-butterfiles";
import NoPermissionView from "./NoPermissionView";
import NoResults from "./NoResults";
import DropFilesHere from "./DropFilesHere";
import { useFileManagerApi } from "~/index";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
    isSearchResult?: boolean;
}

export const EmptyView = ({ browseFiles, isSearchResult }: EmptyViewProps) => {
    const { canRead } = useFileManagerApi();

    if (!canRead) {
        return <NoPermissionView />;
    }
    if (isSearchResult) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={() => browseFiles()} />;
};
