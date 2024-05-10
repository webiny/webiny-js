import * as React from "react";
import styled from "@emotion/styled";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";

export const FieldLabelStyled = styled.label`
    width: 100%;
    display: inline-block;
    margin: 0 0 5px 1px;

    ${props => props.theme.breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }

    .asterisk {
        margin-left: 5px;
        color: ${props => props.theme.styles.colors["color1"]};
    }
`;

interface FieldLabelProps {
    field: FormRenderFbFormModelField;
}

export const FieldLabel = ({ field }: FieldLabelProps) => {
    return (
        <FieldLabelStyled>
            {field.label}
            {field.validation?.some(validation => validation.name === "required") && (
                <span className="asterisk">*</span>
            )}
        </FieldLabelStyled>
    );
};
