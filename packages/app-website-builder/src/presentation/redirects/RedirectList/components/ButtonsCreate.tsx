import React from "react";
import { ReactComponent as Add } from "@webiny/icons/add.svg";
import { Button, Tooltip } from "@webiny/admin-ui";

interface ButtonsCreateProps {
    onCreateDocument: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
    canCreateFolder: boolean;
    canCreateContent: boolean;
}

export const ButtonsCreate = ({
    onCreateFolder,
    onCreateDocument,
    canCreateContent,
    canCreateFolder
}: ButtonsCreateProps) => {
    let newFolderButton = (
        <Button
            data-testid="new-folder-button"
            onClick={onCreateFolder}
            disabled={!canCreateFolder}
            text={"New Folder"}
            icon={<Add />}
            variant={"secondary"}
        />
    );

    if (!canCreateFolder) {
        newFolderButton = (
            <Tooltip
                content={`Cannot create folder because you're not an owner.`}
                trigger={newFolderButton}
            />
        );
    }

    let newEntryButton = (
        <Button
            data-testid="new-entry-button"
            onClick={onCreateDocument}
            disabled={!canCreateContent}
            text={"New Redirect"}
            icon={<Add />}
        />
    );

    if (!canCreateContent) {
        newEntryButton = (
            <Tooltip
                content={`Cannot create redirect because you're not an owner.`}
                trigger={newEntryButton}
            />
        );
    }

    return (
        <>
            {newFolderButton}
            {newEntryButton}
        </>
    );
};
