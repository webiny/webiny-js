import styled from "@emotion/styled";

export const Container = styled("div")`
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 40px;
    background-color: var(--mdc-theme-background);
    border-top: 1px solid var(--mdc-theme-on-background);
`;

export const LoaderContainer = styled("div")`
    display: flex;
    position: relative;
    width: 50px;
    > div {
        background-color: var(--mdc-theme-background);
    }
`;
