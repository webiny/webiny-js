import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
}

export const Sidebar: React.VFC<Props> = ({ folderId }) => {
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
