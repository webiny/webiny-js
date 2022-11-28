import styled from "@emotion/styled";

type ContainerProps = {
    hasClickAction: boolean;
};

export const Container = styled("div")<ContainerProps>`
    display: flex;
    align-items: center;
    color: var(--webiny-theme-color-text-primary);
    fill: currentColor;
    padding: 8px;
    cursor: ${({ hasClickAction }) => hasClickAction && "pointer"};
`;

export const IconContainer = styled.div`
    margin-right: 8px;
    height: 24px;
    width: 24px;
`;

export const Label = styled.strong`
    text-transform: uppercase;
    font-size: 0.75rem;
`;
