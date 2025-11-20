import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarFooter } from "./SidebarFooter.js";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();

    return (
        <div className={"p-xs overflow-auto"} style={{ height: "calc(100vh - 69px)" }}>
            <FolderTree
                focusedFolderId={currentFolderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
            <div className="absolute bottom-0">
                <SidebarFooter />
            </div>
        </div>
    );
};

export { Sidebar };
