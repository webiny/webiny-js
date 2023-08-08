import styled from "@emotion/styled";

export const BulkActionsContainer = styled.div`
    width: 100%;
    height: 64px;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 4;
`;

export const BulkActionsInner = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
`;

export const ButtonsContainer = styled.div`
    display: flex;
    align-items: center;

    .button-container {
        margin: 0;
    }
`;
