import React from "react";
import { Buttons } from "@webiny/app-admin";
import styled from "@emotion/styled";
import { SaveAction } from "./SaveAction";

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

const ModelName = styled.div`
    font-family: var(--mdc-typography-font-family);
    padding: 10px 0;
    font-size: 24px;
`;

export interface SingletonHeaderProps {
    title: string;
}

export const SingletonHeader = ({ title }: SingletonHeaderProps) => {
    return (
        <ToolbarGrid>
            <ModelName>{title}</ModelName>
            <Actions>
                <Buttons actions={[{ name: "save", element: <SaveAction /> }]} />
            </Actions>
        </ToolbarGrid>
    );
};
