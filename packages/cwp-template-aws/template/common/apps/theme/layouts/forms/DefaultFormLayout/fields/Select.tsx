import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";
import styled from "@emotion/styled";
import { Field } from "./components/Field";
import { FieldMessage } from "./components/FieldMessage";
import { FieldLabel } from "./components/FieldLabel";
import { typography, borderRadius, colors } from "../../../../theme";

interface SelectProps {
    field: FormRenderFbFormModelField;
}

const StyledSelect = styled.select`
    ${typography.paragraph1};
    border: 1px solid ${colors.color5};
    background-color: ${colors.color5};
    width: 100%;
    padding: 10px;
    border-radius: ${borderRadius};
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    height: 40px;
    -webkit-appearance: none;
    position: relative;
    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHoiLz48cGF0aCBkPSJNOC43MSAxMS43MWwyLjU5IDIuNTljLjM5LjM5IDEuMDIuMzkgMS40MSAwbDIuNTktMi41OWMuNjMtLjYzLjE4LTEuNzEtLjcxLTEuNzFIOS40MWMtLjg5IDAtMS4zMyAxLjA4LS43IDEuNzF6Ii8+PC9zdmc+");
    background-repeat: no-repeat;
    background-position: center right;

    &:focus {
        border-color: ${colors.color2};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }
`;

export const SelectField: React.FC<SelectProps> = ({ field }) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    return (
        <Field>
            <FieldLabel>{field.label}</FieldLabel>

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
            <FieldMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={field.helpText}
            />
        </Field>
    );
};
