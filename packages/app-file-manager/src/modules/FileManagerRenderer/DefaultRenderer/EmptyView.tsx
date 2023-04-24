import React from "react";
import { FilesRenderChildren } from "react-butterfiles";
import NoPermissionView from "./NoPermissionView";
import NoResults from "./NoResults";
import DropFilesHere from "./DropFilesHere";
import { useFileManagerApi, useFileManagerView } from "~/index";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
}

export const EmptyView = ({ browseFiles }: EmptyViewProps) => {
    const { canRead } = useFileManagerApi();
    const { hasPreviouslyUploadedFiles } = useFileManagerView();

    if (!canRead) {
        return <NoPermissionView />;
    }
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={() => browseFiles()} />;
};
