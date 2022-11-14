import styled from "@emotion/styled";

export const Container = styled("div")`
    & .treeRoot {
        box-sizing: border-box;
        padding: 4px 0 4px;
        min-width: 200px;
    }

    & .dropTarget {
        background: var(--webiny-theme-color-background);
    }
`;
