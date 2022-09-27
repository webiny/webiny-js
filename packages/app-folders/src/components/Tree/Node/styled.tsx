import styled from "@emotion/styled";

type ContainerProps = {
    isFocused: boolean;
};

type ArrowIconContainerProps = {
    isOpen: boolean;
};

export const Container = styled("div")<ContainerProps>`
    display: flex;
    align-items: center;
    padding: 4px 0;
    background: ${props => props.isFocused && "var(--webiny-theme-color-background)"};
    color: var(--webiny-theme-color-text-primary);
    fill: currentColor;
`;

export const Icon = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;
    cursor: pointer;
`;

export const ArrowIcon = styled(Icon)<ArrowIconContainerProps>`
    transition: transform linear 0.1s;
    transform: ${props => (props.isOpen ? "rotate(90deg)" : "rotate(0deg)")};
`;

export const FolderIcon = styled(Icon)`
    margin-right: 8px;
`;

export const Content = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
`;

export const Text = styled("div")`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 24px;
`;
