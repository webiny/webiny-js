import { FilesRenderChildren } from "react-butterfiles";
import NoPermissionView from "~/components/FileManager/NoPermissionView";
import NoResults from "~/components/FileManager/NoResults";
import DropFilesHere from "~/components/FileManager/DropFilesHere";
import React from "react";
import { useFileManager } from "~/components/FileManager/FileManagerContext";

interface EmptyViewProps {
    browseFiles: FilesRenderChildren["browseFiles"];
}

export const EmptyView = ({ browseFiles }: EmptyViewProps) => {
    const { canRead, hasPreviouslyUploadedFiles } = useFileManager();

    if (!canRead) {
        return <NoPermissionView />;
    }
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={() => browseFiles()} />;
};
