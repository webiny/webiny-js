import styled from "@emotion/styled";
import React from "react";

const Horizontal = styled.div`
    display: flex;
    height: calc(100vh - 160px);
`;

const Grow = styled.div<{ flex: number }>`
    flex: ${({ flex }) => flex};
    overflow-y: scroll;
    :last-of-type {
        border-left: 1px solid var(--mdc-theme-on-background);
    }
`;

interface ContentProps {
    children: React.ReactNode;
}

export const Content = ({ children }: ContentProps) => {
    return <Horizontal>{children}</Horizontal>;
};

interface PanelProps {
    flex?: number;
    children: React.ReactNode;
}

const Panel = ({ flex, children }: PanelProps) => {
    return (
        <Grow data-role={"panel"} flex={flex ?? 1}>
            {children}
        </Grow>
    );
};

Content.Panel = Panel;
