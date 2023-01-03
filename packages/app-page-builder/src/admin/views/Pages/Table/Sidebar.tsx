import React, { ReactElement } from "react";
import { FolderTree } from "@webiny/app-folders";

import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";

interface Props {
    folderId?: string;
}

export const Sidebar = ({ folderId }: Props): ReactElement => {
    const { navigateToPageHome, navigateToFolder } = usePageViewNavigation();

    return (
        <FolderTree
            type={"page"}
            title={"All pages"}
            focusedFolderId={folderId}
            onTitleClick={navigateToPageHome}
            onFolderClick={data => data?.id && navigateToFolder(data?.id)}
        />
    );
};
