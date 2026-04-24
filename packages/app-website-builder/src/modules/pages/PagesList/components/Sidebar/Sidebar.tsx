import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarFooter } from "./SidebarFooter.js";
import { usePageListConfig } from "~/modules/pages/configs/index.js";
import { Heading, Separator } from "@webiny/admin-ui";

const Sidebar = () => {
    const { currentFolderId, navigateToFolder } = useNavigateFolder();
    const { browser } = usePageListConfig();

    return (
        <div className={"flex flex-col h-main-content"}>
            <div className={"py-sm px-md"}>
                <Heading level={5}>Pages</Heading>
            </div>
            <Separator />
            <div className={"flex-1 overflow-y-scroll"}>
                <FolderTree
                    folderActions={browser.folder.actions}
                    dropConfirmation={browser.folder.dropConfirmation}
                    focusedFolderId={currentFolderId}
                    onFolderClick={data => navigateToFolder(data.id)}
                    enableActions={true}
                    enableCreate={true}
                />
            </div>
            <div className={"px-xs py-sm bg-neutral-base"}>
                <SidebarFooter />
            </div>
        </div>
    );
};

export { Sidebar };
