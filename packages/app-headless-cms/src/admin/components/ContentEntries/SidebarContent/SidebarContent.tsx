import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

export const SidebarContent = () => {
    const { browser } = useContentEntryListConfig();
    const { navigateToFolder, currentFolderId } = useNavigateFolder();

    return (
        <div className={"flex-1 overflow-y-scroll"}>
            <FolderTree
                folderActions={browser.folder.actions}
                focusedFolderId={currentFolderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </div>
    );
};
