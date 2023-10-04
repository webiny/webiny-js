import React from "react";
import styled from "@emotion/styled";

export const FilterWrapper = styled("div")`
    &:first-of-type {
        margin-top: 24px;
    }
`;

export const GroupContainer = styled("div")`
    margin: 24px 24px 0;
    border: 4px dashed var(--mdc-theme-background);
`;

interface CellInnerProps {
    align: "left" | "center" | "right";
}

export const CellInner = styled(`div`)<CellInnerProps>`
    text-align: ${props => props.align || "left"};
`;

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
