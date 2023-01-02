import React, { ReactElement, useEffect, useState } from "react";
import { FolderTree } from "@webiny/app-folders";
import { useRouter } from "@webiny/react-router";

interface Props {
    folderId?: string;
}

export const Sidebar = ({ folderId }: Props): ReactElement => {
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
        <FolderTree
            type={"page"}
            title={"All pages"}
            focusedFolderId={focusedFolderId}
            onTitleClick={() => history.push("/page-builder/pages")}
            onFolderClick={data => data?.id && onFolderClick(data?.id)}
        />
    );
};
