import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();

    return (
        <div className={"wby-p-xs wby-overflow-auto"} style={{ height: "calc(100vh - 69px)" }}>
            <FolderTree
                focusedFolderId={currentFolderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </div>
    );
};

export { Sidebar };
