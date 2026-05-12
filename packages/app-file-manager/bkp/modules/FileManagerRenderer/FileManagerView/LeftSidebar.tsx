import React, { useEffect } from "react";
import { Separator } from "@webiny/admin-ui";
import { FolderTree, useLoadFolderHierarchy, useListFoldersByParentIds } from "@webiny/app-aco";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { Heading } from "@webiny/admin-ui";

interface LeftSidebarProps {
    currentFolder: string;
    onFolderClick: (folderId: string) => void;
    onCreateFolder?: () => void;
    children?: React.ReactNode;
}

export const LeftSidebar = ({
    currentFolder,
    onFolderClick,
    onCreateFolder,
    children
}: LeftSidebarProps) => {
    const { browser } = useFileManagerViewConfig();
    const { folders, loadFolderHierarchy } = useLoadFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();

    useEffect(() => {
        if (folders.length === 0) {
            loadFolderHierarchy(currentFolder);
        } else {
            listFoldersByParentIds([currentFolder]);
        }
    }, [currentFolder]);

    return (
        <div className={"flex flex-col h-main-content"}>
            <div className={"py-sm px-md"}>
                <Heading level={5}>File Manager</Heading>
            </div>
            <Separator />
            <div className={"flex-1 overflow-y-scroll"}>
                <FolderTree
                    folderActions={browser.folder.actions}
                    dropConfirmation={browser.folder.dropConfirmation}
                    focusedFolderId={currentFolder}
                    onFolderClick={data => onFolderClick(data.id)}
                    enableActions={true}
                    enableCreate={true}
                    onCreateFolder={onCreateFolder}
                />
            </div>
            {children ? <Separator /> : null}
            {children}
        </div>
    );
};
