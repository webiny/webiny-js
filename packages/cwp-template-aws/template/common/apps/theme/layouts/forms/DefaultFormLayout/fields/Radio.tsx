import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";
import { Field } from "./components/Field";
import { FieldErrorMessage } from "./components/FieldErrorMessage";
import { FieldHelperMessage } from "./components/FieldHelperMessage";
import { FieldLabel } from "./components/FieldLabel";
import { StyledInput } from "./Input";
import styled from "@emotion/styled";

interface RadioProps {
    field: FormRenderFbFormModelField;
}

const RadioGroup = styled.div`
    align-items: center;
    display: flex;
    margin: 7px 50px 7px 2px;
    width: 100%;
`;

const RadioButton = styled.input`
    margin-left: 0;
    line-height: 100%;
    background-color: ${props => props.theme.styles.colors["color5"]};
    min-width: 25px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    -webkit-appearance: none;

    &:focus {
        border-color: ${props => props.theme.styles.colors["color2"]};
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

const OtherInput = styled(StyledInput)`
    padding-top: 5px;
    padding-bottom: 5px;
    margin-top: -4px;
    margin-bottom: -4px;
    margin-left: 16px;
`;

export const RadioField = ({ field }: RadioProps) => {
    const { validation, value, onChange } = useBind({
        name: field.fieldId,
        validators: field.validators
    });
    const { value: otherOptionValue, onChange: otherOptionOnChange } = useBind({
        name: `${field.fieldId}Other`
    });

    const fieldId = field.fieldId;

    return (
        <Field>
            <FieldLabel field={field} />
            {field.helpText && <FieldHelperMessage>{field.helpText}</FieldHelperMessage>}
            {(field.options || []).map(option => {
                return (
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
                );
            })}
            {field.settings["otherOption"] && (
                <RadioGroup>
                    <RadioButton
                        name={fieldId}
                        type="radio"
                        id={"radio-" + fieldId + "other"}
                        value="other"
                        checked={value === "other"}
                        onChange={() => onChange("other")}
                    />
                    <label htmlFor={"radio-" + fieldId + "other"}>Other</label>
                    {value === "other" && (
                        <OtherInput
                            name={`${fieldId}Other`}
                            id={`${fieldId}Other`}
                            value={otherOptionValue}
                            onChange={e => otherOptionOnChange(e.target.value)}
                            autoFocus
                        />
                    )}
                </RadioGroup>
            )}
            <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
        </Field>
    );
};
