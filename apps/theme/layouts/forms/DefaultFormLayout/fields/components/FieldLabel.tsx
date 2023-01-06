import * as React from "react";
import styled from "@emotion/styled";
import theme from "../../../../../theme";

export const FieldLabel = styled.div`
    width: 100%;
    display: inline-block;
    line-height: 100%;
    margin: 0 0 5px 1px;

    ${theme.breakpoints.mobile} {
        text-align: left !important;
    }
`;
