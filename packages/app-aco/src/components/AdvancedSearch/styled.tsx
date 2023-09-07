import styled from "@emotion/styled";

import { IconButton } from "@webiny/ui/Button";
import { Drawer as RmwcDrawer } from "@webiny/ui/Drawer";
import React from "react";

export const CloseButton = styled(IconButton)`
    position: absolute;
    top: 15px;
`;

export const DrawerContainer = styled(RmwcDrawer)`
    width: 1000px;
    /* Fix for the dir=rtl when a form is inside a drawer placed on the right side */
    .mdc-floating-label {
        transform-origin: left top !important;
        left: 16px !important;
        right: auto !important;
    }

    .mdc-select__dropdown-icon {
        left: auto !important;
        right: 8px !important;
    }

    .mdc-select__selected-text {
        padding-left: 16px !important;
        padding-right: 52px !important;
    }

    .mdc-switch__native-control {
        left: initial !important;
        right: 0 !important;
    }

    .mdc-switch__thumb-underlay {
        left: -18px;
    }

    .mdc-switch--checked .mdc-switch__thumb-underlay {
        transform: translateX(20px);
    }
`;

export const FilterWrapper = styled("div")`
    &:first-of-type {
        margin-top: 24px;
    }
`;

interface PossibleHiddenFieldProps {
    hidden: boolean;
}

export const PossibleHiddenField = styled("div")<PossibleHiddenFieldProps>`
    display: ${props => (props.hidden ? "none" : "visible")};
`;

interface CellInnerProps {
    align: "left" | "center" | "right";
}

export const CellInner = styled(`div`)<CellInnerProps>`
    text-align: ${props => props.align || "left"};
`;

export const GridOuter = styled("div")`
    margin: 0 24px;
    border: 4px dashed var(--mdc-theme-background);
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
