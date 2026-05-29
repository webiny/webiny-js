import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { EmptyView } from "@webiny/app-admin";
import { Button, Tooltip } from "@webiny/admin-ui";

interface EmptyProps {
    isSearch: boolean;
    onCreateDocument: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
    canCreateContent: boolean;
    canCreateFolder: boolean;
}

export const Empty = ({
    isSearch,
    onCreateDocument,
    onCreateFolder,
    canCreateContent,
    canCreateFolder
}: EmptyProps) => {
    if (isSearch) {
        return <EmptyView icon={<SearchIcon />} title={"No results found."} action={null} />;
    }

    let createDocumentButton = (
        <Button
            variant={"primary"}
            onClick={onCreateDocument}
            disabled={!canCreateContent}
            text={"New redirect"}
            icon={<AddIcon />}
        />
    );

    if (!canCreateContent) {
        createDocumentButton = (
            <Tooltip
                trigger={createDocumentButton}
                content={`Cannot create redirect because you're not an owner.`}
                side={"bottom"}
            />
        );
    }

    let createFolderButton = (
        <Button
            variant={"secondary"}
            onClick={onCreateFolder}
            disabled={!canCreateFolder}
            text={"New folder"}
            icon={<AddIcon />}
        />
    );

    if (!canCreateFolder) {
        createFolderButton = (
            <Tooltip
                trigger={createFolderButton}
                content={`Cannot create folder because you're not an owner.`}
                side={"bottom"}
            />
        );
    }

    return (
        <EmptyView
            title={`Nothing to show here. ${
                canCreateContent
                    ? "Navigate to a different folder or create a..."
                    : "Click on the left side to navigate to a different folder."
            }`}
            action={
                <>
                    {createFolderButton}
                    {createDocumentButton}
                </>
            }
        />
    );
};
