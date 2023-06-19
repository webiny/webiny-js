import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
    rootFolderLabel: string;
}

export const Sidebar: React.VFC<Props> = ({ folderId, rootFolderLabel }) => {
    const { navigateToFolder } = useNavigateFolder();

    return (
        <SidebarContainer>
            <FolderTree
                rootFolderLabel={rootFolderLabel}
                focusedFolderId={folderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </SidebarContainer>
    );
};
