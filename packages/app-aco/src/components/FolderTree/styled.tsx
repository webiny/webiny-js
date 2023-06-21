import styled from "@emotion/styled";

export const Container = styled("div")`
    position: relative;
    margin: 0;

    & .treeRoot {
        box-sizing: border-box;
        min-width: 200px;
    }

    & .dropTarget {
        background: var(--mdc-theme-on-background);
    }

    & .draggingSource {
        opacity: 0.5;
    }

    & .placeholderContainer {
        position: relative;
    }
`;
