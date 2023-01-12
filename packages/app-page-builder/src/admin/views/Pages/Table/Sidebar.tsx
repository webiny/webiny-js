import React, { ReactElement } from "react";
import { FolderTree } from "@webiny/app-aco";

import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";

import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Sidebar = ({ folderId, defaultFolderName }: Props): ReactElement => {
    const { navigateToPageHome, navigateToFolder } = usePageViewNavigation();

    return (
        <SidebarContainer>
            <FolderTree
                type={"page"}
                title={defaultFolderName}
                focusedFolderId={folderId}
                onTitleClick={() => navigateToPageHome()}
                onFolderClick={data => data?.id && navigateToFolder(data?.id)}
            />
        </SidebarContainer>
    );
};
