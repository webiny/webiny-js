import styled from "@emotion/styled";

export const Container = styled("div")`
    position: relative;
    margin: 0 0 32px;

    & .treeRoot {
        box-sizing: border-box;
        padding: 36px 0 0;
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
