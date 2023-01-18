import styled from "@emotion/styled";

export const Container = styled("div")`
    padding: 8px 0;
    width: 100%;
    height: 48px;
    background: var(--mdc-theme-surface);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;

export const WrapperActions = styled("div")`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;
