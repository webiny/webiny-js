import styled from "@emotion/styled";

export const MainContainer = styled("div")`
    overflow: hidden;
    position: relative;
    height: 100%;
    margin-right: 8px;
`;

export const Wrapper = styled("div")`
    width: 100%;
    position: absolute;
    top: 64px;
    bottom: 0;
    left: 0;
    border-radius: 4px;
    overflow: hidden;

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

export const SidebarContainer = styled("div")`
    height: calc(100vh - 67px);
    overflow-y: scroll;
    background: var(--mdc-theme-background);
    padding-top: 12px;
`;
