import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();
    const { browser } = useRedirectListConfig();

    return (
        <div className={"p-xs overflow-auto"} style={{ height: "calc(100vh - 69px)" }}>
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

export { Sidebar };
