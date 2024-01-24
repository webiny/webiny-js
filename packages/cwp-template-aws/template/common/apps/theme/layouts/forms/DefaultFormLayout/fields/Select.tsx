import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";
import styled from "@emotion/styled";
import { Field } from "./components/Field";
import { FieldErrorMessage } from "./components/FieldErrorMessage";
import { FieldHelperMessage } from "./components/FieldHelperMessage";
import { FieldLabel } from "./components/FieldLabel";

interface SelectProps {
    field: FormRenderFbFormModelField;
}

export const StyledSelect = styled.select`
    ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph1")};
    border: 1px solid ${props => props.theme.styles.colors["color5"]};
    background-color: ${props => props.theme.styles.colors["color5"]};
    width: 100%;
    padding: 10px;
    border-radius: ${props => props.theme.styles.borderRadius};
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    height: 40px;
    -webkit-appearance: none;
    position: relative;
    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHoiLz48cGF0aCBkPSJNOC43MSAxMS43MWwyLjU5IDIuNTljLjM5LjM5IDEuMDIuMzkgMS40MSAwbDIuNTktMi41OWMuNjMtLjYzLjE4LTEuNzEtLjcxLTEuNzFIOS40MWMtLjg5IDAtMS4zMyAxLjA4LS43IDEuNzF6Ii8+PC9zdmc+");
    background-repeat: no-repeat;
    background-position: center right;

    &:focus {
        border-color: ${props => props.theme.styles.colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const SelectField = ({ field }: SelectProps) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    return (
        <Field>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            <StyledSelect
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                id={field.fieldId}
                name={field.fieldId}
            >
                <option disabled value={""}>
                    {field.placeholderText}
                </option>
                {(field.options || []).map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </StyledSelect>
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
};
