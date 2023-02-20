import * as React from "react";
import styled from "@emotion/styled";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { breakpoints, colors } from "../../../../../theme";

export const FieldLabelStyled = styled.label`
    width: 100%;
    display: inline-block;
    margin: 0 0 5px 1px;
    ${breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }

    .asterisk {
        margin-left: 5px;
        color: ${colors.color1};
    }
`;

interface FieldLabelProps {
    field: FormRenderFbFormModelField;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ field }) => {
    return (
        <FieldLabelStyled>
            {field.label}
            {field.validation?.some(validation => validation.name === "required") && (
                <span className="asterisk">*</span>
            )}
        </FieldLabelStyled>
    );
};
