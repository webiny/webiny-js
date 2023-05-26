import React from "react";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Sidebar: React.VFC<Props> = ({ folderId, defaultFolderName }) => {
    const { navigateToListHome, navigateToFolder } = useNavigateFolder();

    return (
        <SidebarContainer>
            <FolderTree
                title={defaultFolderName}
                focusedFolderId={folderId}
                onTitleClick={() => navigateToListHome()}
                onFolderClick={data => data?.id && navigateToFolder(data?.id)}
                enableActions={true}
                enableCreate={true}
            />
        </SidebarContainer>
    );
};
