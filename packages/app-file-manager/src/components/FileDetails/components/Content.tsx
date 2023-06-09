import styled from "@emotion/styled";
import React from "react";

const Horizontal = styled.div`
    display: flex;
`;

const Grow = styled.div`
    flex: 1;
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
    children: React.ReactNode;
}

const Panel = ({ children }: PanelProps) => {
    return <Grow data-role={"panel"}>{children}</Grow>;
};

Content.Panel = Panel;
