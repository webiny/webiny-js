import styled from "@emotion/styled";

export const MainContainer = styled("div")`
    overflow: hidden;
    position: relative;
    height: 100%;
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
`;

export const SidebarContainer = styled("div")`
    height: calc(100vh - 64px);
    padding: 10px 10px 0;
    overflow-y: scroll;
    background: var(--mdc-theme-surface);
    border-right: 1px solid var(--mdc-theme-on-background);
`;
