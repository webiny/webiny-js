import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add.svg";
import { ReactComponent as SavedSearchIcon } from "@material-design-icons/svg/outlined/saved_search.svg";
import { Typography } from "@webiny/ui/Typography";

interface CellInnerProps {
    align: "left" | "center" | "right";
}

export const CellInner = styled(`div`)<CellInnerProps>`
    text-align: ${props => props.align || "left"};
`;

export const AccordionItemInner = styled.div`
    position: relative;
`;

export const FilterContainer = styled.div`
    .mdc-layout-grid {
        padding: 4px;
    }
`;

export const DetailsContainer = styled.div`
    margin-bottom: 24px;
`;

export const FilterDetailsIcon = styled(SavedSearchIcon)`
    width: 48px;
    height: auto;
    fill: var(--mdc-theme-text-icon-on-background);
`;

export const FilterDetailsDetails = styled(Typography)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const FilterOperationContainer = styled.div`
    margin-right: 8px;
`;

export const GroupOperationLabelContainer = styled.span`
    background: #fff;
    border: 1px solid var(--mdc-theme-background);
    border-radius: 24px;
    width: 56px;
    height: 28px;
    line-height: 28px;
    position: absolute;
    bottom: -13px;
    left: 50%;
    margin-left: -28px;
    z-index: 10;
    text-align: center;
`;

export const FilterOperationLabelContainer = styled.div`
    padding: 12px 0;
    text-align: center;
`;

export const AddFilterInner = styled.div`
    padding: 16px 0 16px;
    text-align: center;
`;

export const AddGroupInner = styled.div`
    padding: 24px 0 0;
    text-align: center;
`;

export const ButtonIcon = styled(AddIcon)`
    fill: var(--mdc-theme-primary);
    width: 18px;
    margin-right: 8px;
`;

const Horizontal = styled.div`
    display: flex;
    height: calc(100vh - 166px);
`;

const Grow = styled.div`
    flex: 1;
    overflow: scroll;
    padding: 24px;
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
