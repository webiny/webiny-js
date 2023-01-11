import styled from "@emotion/styled";
import { breakpoints } from "../../../../../theme";

export const FieldLabel = styled.label`
    width: 100%;
    display: inline-block;
    margin: 0 0 5px 1px;

    ${breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }
`;
