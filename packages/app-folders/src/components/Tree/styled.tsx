import styled from "@emotion/styled";

export const Container = styled("div")`
    height: 100%;

    & .treeRoot {
        box-sizing: border-box;
        height: 100vh;
    }

    & .dropTarget {
        background: var(--webiny-theme-color-background);
    }
`;
