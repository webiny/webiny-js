import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";
import { Field } from "./components/Field";
import { FieldMessage } from "./components/FieldMessage";
import { FieldLabel } from "./components/FieldLabel";
import styled from "@emotion/styled";
import { colors } from "../../../../theme";

interface RadioProps {
    field: FormRenderFbFormModelField;
}

const RadioGroup = styled.div`
    align-items: center;
    display: flex;
    margin: 5px 50px 5px 2px;
    width: 100%;
`;

const RadioButton = styled.input`
    margin-left: 0;
    line-height: 100%;
    background-color: ${colors.color5};
    min-width: 25px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    -webkit-appearance: none;

    &:focus {
        border-color: ${colors["color2"]};
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        outline: none;
    }

    &:checked {
        background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHoiLz48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MiAwLTgtMy41OC04LThzMy41OC04IDgtOCA4IDMuNTggOCA4LTMuNTggOC04IDh6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNSIvPjwvc3ZnPg==");
        background-repeat: no-repeat;
        background-size: cover;
    }

    & + label {
        line-height: 100%;
        margin-left: 10px;
        padding-top: 2px;
    }
`;

export const RadioField: React.FC<RadioProps> = ({ field }) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    const fieldId = field.fieldId;

    return (
        <Field>
            <FieldLabel>{field.label}</FieldLabel>

            {(field.options || []).map(option => (
                <RadioGroup key={option.value}>
                    <RadioButton
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        name={fieldId}
                        type="radio"
                        id={"radio-" + fieldId + option.value}
                        value={option.value}
                    />
                    <label htmlFor={"radio-" + fieldId + option.value}>{option.label}</label>
                </RadioGroup>
            ))}
            <FieldMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={field.helpText}
            />
        </Field>
    );
};
