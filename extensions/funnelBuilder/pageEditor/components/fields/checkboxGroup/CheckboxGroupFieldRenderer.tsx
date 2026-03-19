import React from "react";
import styled from "@emotion/styled";
import { FieldErrorMessage } from "../components/FieldErrorMessage";
import { FieldHelperMessage } from "../components/FieldHelperMessage";
import { FieldLabel } from "../components/FieldLabel";
import { Field } from "../components/Field";
import { createFieldRenderer } from "../createFieldRenderer";
import { CheckboxGroupField } from "../../../../shared/models/fields/CheckboxGroupField";

export const CheckboxGroup = styled.div`
    align-items: center;
    display: flex;
    margin: 5px 50px 5px 2px;
    width: 100%;
`;

export const CheckboxButton = styled.input`
    margin-left: 0;
    background-color: ${props => props.theme.styles.colors["color5"]};
    min-width: 25px;
    width: 25px;
    height: 25px;
    -webkit-appearance: none;
    border-radius: ${props => props.theme.styles.borderRadius};

    &:focus {
        border-color: ${props => props.theme.styles.colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }

    &:checked {
        background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHoiLz48cGF0aCBkPSJNMTkgM0g1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bS04LjI5IDEzLjI5Yy0uMzkuMzktMS4wMi4zOS0xLjQxIDBMNS43MSAxMi43Yy0uMzktLjM5LS4zOS0xLjAyIDAtMS40MS4zOS0uMzkgMS4wMi0uMzkgMS40MSAwTDEwIDE0LjE3bDYuODgtNi44OGMuMzktLjM5IDEuMDItLjM5IDEuNDEgMCAuMzkuMzkuMzkgMS4wMiAwIDEuNDFsLTcuNTggNy41OXoiLz48L3N2Zz4=");
    }

    & + label {
        margin-left: 10px;
        padding-top: 2px;
    }
`;

interface Option {
    value: string;
    label: string;
}

interface ChangeParams {
    option: Option;
    value: string[];
    onChange: (values: string[]) => void;
}

const change = ({ option, value, onChange }: ChangeParams) => {
    const newValues = Array.isArray(value) ? [...value] : [];
    if (newValues.includes(option.value)) {
        newValues.splice(newValues.indexOf(option.value), 1);
    } else {
        newValues.push(option.value);
    }

    onChange(newValues);
};

interface CheckedParams {
    option: Option;
    value: string[];
}

const checked = ({ option, value }: CheckedParams) => {
    return Array.isArray(value) && value.includes(option.value);
};

export const CheckboxGroupFieldRenderer = createFieldRenderer<CheckboxGroupField>(props => {
    const {
        validation,
        value,
        onChange,
        isDisabled,
        field: { definition: field }
    } = props;

    return (
        <Field disabled={isDisabled}>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            {(field.extra.options || []).map((option: any) => (
                <CheckboxGroup key={option.value}>
                    <CheckboxButton
                        disabled={isDisabled}
                        name={field.fieldId}
                        type="checkbox"
                        id={"checkbox-" + field.fieldId + option.value}
                        checked={checked({ option, value })}
                        onChange={() => change({ option, value, onChange })}
                    />
                    <label htmlFor={"checkbox-" + field.fieldId + option.value}>
                        {option.label}
                    </label>
                </CheckboxGroup>
            ))}
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
});
