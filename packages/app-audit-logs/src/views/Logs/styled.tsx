import styled from "@emotion/styled";

export const MainContainer = styled("div")`
    overflow: hidden;
    position: relative;
    height: calc(100vh - 70px);
`;

export const Wrapper = styled("div")`
    width: 100%;
    position: absolute;
    top: 65px;
    bottom: 0;
    left: 0;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

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
