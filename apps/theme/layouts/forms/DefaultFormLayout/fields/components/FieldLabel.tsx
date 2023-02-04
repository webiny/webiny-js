import styled from "@emotion/styled";
import theme from "../../../../../theme";

export const FieldLabel = styled.label`
    width: 100%;
    display: inline-block;
    margin: 0 0 5px 1px;
    ${theme.breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }
`;
