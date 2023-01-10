import styled from "@emotion/styled";

type ContainerProps = {
    hasClickAction: boolean;
    isDragging: boolean;
};

export const Container = styled("div")<ContainerProps>`
    position: absolute;
    top: 8px;
    left: 0;
    display: flex;
    align-items: center;
    color: var(--webiny-theme-color-text-secondary);
    fill: currentColor;
    padding: 0 8px 0;
    cursor: ${({ hasClickAction }) => hasClickAction && "pointer"};
    // The title acts like is not there, so user can drag a folder over the title and move it to the root.
    pointer-events: ${({ isDragging }) => (isDragging ? "none" : "auto")};
`;

export const IconContainer = styled.div`
    margin-right: 4px;
    height: 24px;
    width: 24px;
`;
