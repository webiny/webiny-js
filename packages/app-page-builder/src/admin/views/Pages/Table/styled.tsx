import styled from "@emotion/styled";

export const Container = styled("div")`
    overflow: hidden;
    position: relative;
    height: 100%;
`;

export const Wrapper = styled("div")`
    width: 100%;
    position: absolute;
    top: 52px;
    bottom: 0;
    left: 0;
    background: var(--mdc-theme-surface);

    .mdc-data-table {
        display: inline-table;
    }

    .mdc-data-table__cell {
        width: 250px;
        max-width: 250px;

        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;
