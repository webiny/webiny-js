/*
Things to show:
- Empty view in case of no items inside a folder
- List of folders and items for root page
- List of folders and items for folder page
- Buttons:
    Create new folder
    Create new page
- List Elements
    Name
    Author
    Last modified
    Template
    Status
    Actions


PROBLEMS:
- How to show links at root level? no reference between linkId and entryId?
    - SOLUTION: create a linkId for each entry within the system - the link will be referenced to ROOT
- Should we run an upgrade script to create a linkId for each entry within the system?
*/

import React from "react";

import { useFolders, useLinks } from "@webiny/app-folders";

interface Props {
    currentFolderId?: string;
}

export const List = ({ currentFolderId }: Props) => {
    const { folders } = useFolders("page");
    const { links } = useLinks(currentFolderId as string);

    const currentSubFolders =
        folders && folders.filter(folder => currentFolderId && folder.parentId === currentFolderId);

    return (
        <>
            {"FolderId"} {currentFolderId}
            {JSON.stringify(currentSubFolders)}
            {"LINKS"}
            {JSON.stringify(links)}
        </>
    );
};
