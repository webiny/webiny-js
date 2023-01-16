import * as React from "react";
import { useBind } from "@webiny/form";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { Field } from "./components/Field";
import { FieldMessage } from "./components/FieldMessage";
import { FieldLabel } from "./components/FieldLabel";
import styled from "@emotion/styled";
import { colors, borderRadius, typography } from "../../../../theme";

interface TextareaProps {
    field: FormRenderFbFormModelField;
}

const StyledTextarea = styled.textarea`
    border: 1px solid ${colors.color5};
    background-color: ${colors.color5};
    width: 100%;
    padding: 10px;
    border-radius: ${borderRadius};
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    ${typography.paragraph1};

    &:focus {
        border-color: ${colors.color2};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const TextareaField: React.FC<TextareaProps> = ({ field }) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    return (
        <Field>
            <FieldLabel>{field.label}</FieldLabel>

            <StyledTextarea
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={field.placeholderText}
                rows={field.settings.rows ? field.settings.rows : 4}
                name={field.fieldId}
                id={field.fieldId}
            />
            <FieldMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={field.helpText}
            />
        </Field>
    );
};
