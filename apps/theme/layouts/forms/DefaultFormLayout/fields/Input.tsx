import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";
import styled from "@emotion/styled";

import { FieldErrorMessage } from "./components/FieldErrorMessage";
import { FieldHelperMessage } from "./components/FieldHelperMessage";
import { FieldLabel } from "./components/FieldLabel";
import { Field } from "./components/Field";
import theme from "../../../../theme";

interface InputProps {
    field: FormRenderFbFormModelField;
    type?: string;
}

const StyledInput = styled.input`
    border: 1px solid ${theme.styles.colors["color5"]};
    background-color: ${theme.styles.colors["color5"]};
    width: 100%;
    padding: 10px;
    border-radius: ${theme.styles.borderRadius};
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    ${theme.styles.typography["paragraph1"]};

    &:focus {
        border-color: ${theme.styles.colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const InputField: React.FC<InputProps> = ({ field, type }) => {
    const { validate, validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    const onBlur = (ev: React.SyntheticEvent) => {
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            ev.persist();
            validate();
        }
    };

    return (
        <Field>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            <StyledInput
                onBlur={onBlur}
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={field.placeholderText}
                type={type}
                name={field.fieldId}
                id={field.fieldId}
            />
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
};
