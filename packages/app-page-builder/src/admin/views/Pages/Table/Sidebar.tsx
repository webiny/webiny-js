import React from "react";
import { FolderTree } from "@webiny/app-aco";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";
import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Sidebar: React.VFC<Props> = ({ folderId, defaultFolderName }) => {
    const { navigateToPageHome, navigateToFolder } = usePageViewNavigation();

    return (
        <SidebarContainer>
            <FolderTree
                title={defaultFolderName}
                focusedFolderId={folderId}
                onTitleClick={() => navigateToPageHome()}
                onFolderClick={data => data?.id && navigateToFolder(data?.id)}
                enableActions={true}
                enableCreate={true}
            />
        </SidebarContainer>
    );
};
