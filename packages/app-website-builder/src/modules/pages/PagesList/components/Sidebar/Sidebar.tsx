import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarFooter } from "./SidebarFooter.js";
import { usePageListConfig } from "~/modules/pages/configs/index.js";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();
    const { browser } = usePageListConfig();

    return (
        <div className={"p-xs overflow-auto relative"} style={{ height: "calc(100vh - 69px)" }}>
            <FolderTree
                folderActions={browser.folder.actions}
                dropConfirmation={browser.folder.dropConfirmation}
                focusedFolderId={currentFolderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
            <div className="absolute bottom-0 w-full">
                <SidebarFooter />
            </div>
        </div>
    );
};

export { Sidebar };
