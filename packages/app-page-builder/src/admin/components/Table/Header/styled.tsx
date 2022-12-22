import styled from "@emotion/styled";

export const Container = styled("div")`
    padding: 8px 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    background: var(--mdc-theme-surface);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;

    > button {
        margin-right: 16px;
    }
`;
