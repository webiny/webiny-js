import styled from "@emotion/styled";

export const Container = styled("div")`
    height: 100%;

    & .treeRoot {
        box-sizing: border-box;
        padding: 4px 0 16px;
        width: 250px;
    }

    & .dropTarget {
        background: var(--webiny-theme-color-background);
    }
`;
