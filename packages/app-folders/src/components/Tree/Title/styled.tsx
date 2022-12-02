import styled from "@emotion/styled";

type ContainerProps = {
    hasClickAction: boolean;
};

export const Container = styled("div")<ContainerProps>`
    display: flex;
    align-items: center;
    color: var(--webiny-theme-color-text-secondary);
    fill: currentColor;
    padding: 8px;
    cursor: ${({ hasClickAction }) => hasClickAction && "pointer"};
`;

export const IconContainer = styled.div`
    margin-right: 4px;
    height: 24px;
    width: 24px;
`;
