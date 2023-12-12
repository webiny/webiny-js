import * as React from "react";
import { useBind } from "@webiny/form";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { Field } from "./components/Field";
import { FieldErrorMessage } from "./components/FieldErrorMessage";
import { FieldHelperMessage } from "./components/FieldHelperMessage";
import { FieldLabel } from "./components/FieldLabel";
import styled from "@emotion/styled";

interface TextareaProps {
    field: FormRenderFbFormModelField;
}

const StyledTextarea = styled.textarea`
    border: 1px solid ${props => props.theme.styles.colors["color5"]};
    background-color: ${props => props.theme.styles.colors["color5"]};
    width: 100%;
    padding: 10px;
    border-radius: ${props => props.theme.styles.borderRadius};
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph1")};

    &:focus {
        border-color: ${props => props.theme.styles.colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const TextareaField = ({ field }: TextareaProps) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    return (
        <Field>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            <StyledTextarea
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={field.placeholderText}
                rows={field.settings.rows ? field.settings.rows : 4}
                name={field.fieldId}
                id={field.fieldId}
            />
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
};
