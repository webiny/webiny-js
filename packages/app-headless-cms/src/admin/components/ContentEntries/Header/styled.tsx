import styled from "@emotion/styled";

export const Container = styled("div")`
    padding: 8px 20px 8px 0;
    width: 100%;
    height: 65px;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    background: var(--mdc-theme-surface);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const WrapperActions = styled("div")`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
`;
