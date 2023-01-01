import React, { ReactElement, useEffect, useState } from "react";
import { FolderTree } from "@webiny/app-folders";
import { useRouter } from "@webiny/react-router";

import { SidebarContainer } from "./styled";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Sidebar = ({ folderId, defaultFolderName }: Props): ReactElement => {
    const [focusedFolderId, setFocusedFolderId] = useState<string>();
    const { history, location } = useRouter();
    const query = new URLSearchParams(location.search);

    useEffect(() => {
        setFocusedFolderId(folderId);
    }, [folderId]);

    const onFolderClick = (folderId: string): void => {
        setFocusedFolderId(folderId);
        query.set("folderId", folderId);
        history.push({ search: query.toString() });
    };

    return (
        <SidebarContainer>
            <FolderTree
                type={"page"}
                title={defaultFolderName}
                focusedFolderId={focusedFolderId}
                onTitleClick={() => history.push("/page-builder/pages-table")}
                onFolderClick={data => data?.id && onFolderClick(data?.id)}
            />
        </SidebarContainer>
    );
};
