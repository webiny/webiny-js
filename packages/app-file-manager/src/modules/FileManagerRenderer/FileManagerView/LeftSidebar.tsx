import React from "react";
import styled from "@emotion/styled";
import { FolderTree } from "@webiny/app-aco";

const Divider = styled.div`
    height: 1px;
    background-color: var(--mdc-theme-on-background);
    margin: 12px 8px;
`;

const LeftSidebarContainer = styled.div`
    padding: 8px;
    height: calc(100vh - 64px);
    background-color: var(--mdc-theme-surface);
    border-right: 1px solid var(--mdc-theme-on-background);
    overflow-y: scroll;
`;

interface LeftSidebarProps {
    currentFolder?: string;
    onFolderClick: (folderId: string) => void;
    children?: React.ReactNode;
}

export const LeftSidebar = ({ currentFolder, onFolderClick, children }: LeftSidebarProps) => {
    return (
        <LeftSidebarContainer>
            <FolderTree
                focusedFolderId={currentFolder}
                onFolderClick={data => onFolderClick(data.id)}
                enableActions={true}
                enableCreate={true}
            />
            {children ? <Divider /> : null}
            {children}
        </LeftSidebarContainer>
    );
};
