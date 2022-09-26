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
`;

export const IconContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;
    cursor: pointer;
`;

export const ArrowIconContainer = styled(IconContainer)<ArrowIconContainerProps>`
    transition: transform linear 0.1s;

    transform: ${props => (props.isOpen ? "rotate(90deg)" : "rotate(0deg)")};
`;

export const FolderIconContainer = styled(IconContainer)`
    margin-right: 8px;
`;

export const Label = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
`;
