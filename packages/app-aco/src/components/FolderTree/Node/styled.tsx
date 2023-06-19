import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

type ContainerProps = {
    isFocused: boolean;
};

type ArrowIconContainerProps = {
    isOpen: boolean;
};

export const Container = styled("div")<ContainerProps>`
    display: flex;
    align-items: center;
    padding: 4px 0 4px 4px;
    background: ${props => props.isFocused && "var(--mdc-theme-on-background)"};
    color: var(--webiny-theme-color-text-secondary);
    fill: currentColor;
    position: relative;
    &:hover .folder-tree-menu-action {
        visibility: visible;
    }
`;

export const Icon = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;
    cursor: pointer;
    fill: var(--mdc-theme-text-secondary-on-background);
`;

export const ArrowIcon = styled(Icon)<ArrowIconContainerProps>`
    transition: transform linear 0.1s;
    transform: ${props => (props.isOpen ? "rotate(90deg)" : "rotate(0deg)")};
`;

export const FolderIcon = styled(Icon)`
    margin-right: 4px;
`;

export const Content = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
`;

export const Text = styled(Typography)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 24px;
    &.focused {
        font-weight: 600;
    }
`;
