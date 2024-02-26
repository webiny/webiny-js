import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
}

export const Sidebar = ({ folderId }: Props) => {
    const { navigateToFolder } = useNavigateFolder();

    return (
        <SidebarContainer>
            <FolderTree
                focusedFolderId={folderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </SidebarContainer>
    );
};
