import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { FieldErrorMessage } from "../components/FieldErrorMessage";
import { FieldHelperMessage } from "../components/FieldHelperMessage";
import { FieldLabel } from "../components/FieldLabel";
import { Field } from "../components/Field";
import { createFieldRenderer } from "../createFieldRenderer";
import { TextareaField } from "../../../../shared/models/fields/TextareaField";

const StyledTextarea = styled.textarea`
    border: 1px solid ${props => props.theme.styles.colors["color5"]};
    background-color: ${props => props.theme.styles.colors["color5"]};
    width: 100%;
    padding: 10px;
    border-radius: ${props => props.theme.styles.borderRadius};
    box-sizing: border-box;
    transition:
        border-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out;
    ${props => props.theme.styles.typography.paragraphs.stylesById("paragraph1")};

    &:focus {
        border-color: ${props => props.theme.styles.colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const TextareaFieldRenderer = createFieldRenderer<TextareaField>(props => {
    const {
        validate,
        validation,
        value,
        onChange,
        isDisabled,
        field: { definition: field }
    } = props;

    const onBlur = useCallback(
        (ev: React.SyntheticEvent) => {
            ev.persist();
            validate();
        },
        [validate]
    );

    return (
        <Field disabled={isDisabled}>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            <StyledTextarea
                disabled={isDisabled}
                onBlur={onBlur}
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={field.extra.placeholderText}
                rows={field.extra.rows}
                name={field.fieldId}
                id={field.fieldId}
            />
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
});
