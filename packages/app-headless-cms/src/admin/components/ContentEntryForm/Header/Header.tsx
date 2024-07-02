import React from "react";
import { Buttons } from "@webiny/app-admin";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";

import { ContentFormOptionsMenu } from "./ContentFormOptionsMenu";
import { RevisionSelector } from "~/admin/components/ContentEntryForm/Header/RevisionSelector";
import styled from "@emotion/styled";

const ToolbarGrid = styled.div`
    padding: 15px;
    border-bottom: 1px solid var(--mdc-theme-on-background);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Actions = styled.div`
    display: flex;
    align-items: center;
`;

export const Header = () => {
    const { buttonActions } = useContentEntryEditorConfig();

    return (
        <ToolbarGrid>
            <div>
                <RevisionSelector />
            </div>
            <Actions>
                <Buttons actions={buttonActions} />
                <ContentFormOptionsMenu />
            </Actions>
        </ToolbarGrid>
    );
};
