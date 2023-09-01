import styled from "@emotion/styled";
import React from "react";

const Horizontal = styled.div`
    display: flex;
    height: calc(100vh - 166px);
`;

const Grow = styled.div`
    flex: 1;
    overflow: scroll;
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
