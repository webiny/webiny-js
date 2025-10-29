import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";

export const SidebarContent = () => {
    const { navigateToFolder, currentFolderId } = useNavigateFolder();

    return (
        <div className={"p-xs flex-1 overflow-y-scroll"}>
            <FolderTree
                focusedFolderId={currentFolderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </div>
    );
};
