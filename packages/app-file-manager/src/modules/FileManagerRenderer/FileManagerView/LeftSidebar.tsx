import React, { useEffect } from "react";
import { Separator } from "@webiny/admin-ui";
import { FolderTree, useLoadFolderHierarchy, useListFoldersByParentIds } from "@webiny/app-aco";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { Heading } from "@webiny/admin-ui";

interface LeftSidebarProps {
    currentFolder: string;
    onFolderClick: (folderId: string) => void;
    children?: React.ReactNode;
}

export const LeftSidebar = ({ currentFolder, onFolderClick, children }: LeftSidebarProps) => {
    const { browser } = useFileManagerViewConfig();
    const { folders, loadFolderHierarchy } = useLoadFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();

    useEffect(() => {
        if (folders.length === 0) {
            loadFolderHierarchy(currentFolder);
        } else {
            // Otherwise let's load only the current folder sub-tree
            listFoldersByParentIds([currentFolder]);
        }
    }, [currentFolder]);

    return (
        <div className={"p-xs overflow-auto"} style={{ height: "calc(100vh - 69px)" }}>
            <div className={"p-sm"}>
                <Heading level={5}>File Manager</Heading>
            </div>
            <Separator />
            <FolderTree
                folderActions={browser.folder.actions}
                dropConfirmation={browser.folder.dropConfirmation}
                focusedFolderId={currentFolder}
                onFolderClick={data => onFolderClick(data.id)}
                enableActions={true}
                enableCreate={true}
            />
            {children ? <Separator /> : null}
            {children}
        </div>
    );
};
