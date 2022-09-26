import styled from "@emotion/styled";

export const Container = styled("div")`
    height: 100%;

    & .treeRoot {
        box-sizing: border-box;
        height: 100vh;
        margin-top: 4px;
        margin-left: 16px;
    }

    & .dropTarget {
        background: var(--webiny-theme-color-background);
    }
`;
