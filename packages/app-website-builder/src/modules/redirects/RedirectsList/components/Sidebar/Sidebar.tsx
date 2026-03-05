import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";
import { Heading, Separator } from "@webiny/admin-ui";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();
    const { browser } = useRedirectListConfig();

    return (
        <div className={"flex flex-col h-main-content"}>
            <div className={"py-sm px-md"}>
                <Heading level={5}>Redirects</Heading>
            </div>
            <Separator />
            <div className={"flex-1 overflow-y-scroll"}>
                <FolderTree
                    folderActions={browser.folder.actions}
                    focusedFolderId={currentFolderId}
                    onFolderClick={data => navigateToFolder(data.id)}
                    enableActions={true}
                    enableCreate={true}
                />
            </div>
        </div>
    );
};

export { Sidebar };
