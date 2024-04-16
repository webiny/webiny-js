import styled from "@emotion/styled";

export const MainContainer = styled("div")`
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

    .mdc-data-table {
        display: inline-table;
    }
`;
