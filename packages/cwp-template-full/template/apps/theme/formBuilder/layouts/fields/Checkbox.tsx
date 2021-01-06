import React from "react";
import { FbFormModelField } from "@webiny/app-form-builder/types";
import { BindComponentRenderProp } from "@webiny/form";
import HelperMessage from "../components/HelperMessage";

type Props = {
    bind: BindComponentRenderProp;
    field: FbFormModelField;
};

const change = ({ option, value, onChange }) => {
    const newValues = Array.isArray(value) ? [...value] : [];
    if (newValues.includes(option.value)) {
        newValues.splice(newValues.indexOf(option.value), 1);
    } else {
        newValues.push(option.value);
    }

    onChange(newValues);
};

const checked = ({ option, value }) => {
    return Array.isArray(value) && value.includes(option.value);
};

const Checkbox = (props: Props) => {
    const { onChange, value, validation } = props.bind;
    const fieldId = props.field.fieldId;

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--checkbox">
            <label className="webiny-fb-form-field__label webiny-pb-typography-body">
                {props.field.label}
            </label>
            <div className="webiny-fb-form-field__checkbox-group">
                {props.field.options.map(option => (
                    <div className="webiny-fb-form-field__checkbox" key={option.value}>
                        <input
                            name={fieldId}
                            className="webiny-fb-form-field__checkbox-input"
                            type="checkbox"
                            id={"checkbox-" + fieldId + option.value}
                            checked={checked({ option, value })}
                            onChange={() => change({ option, value, onChange })}
                        />
                        <label
                            htmlFor={"checkbox-" + fieldId + option.value}
                            className="webiny-fb-form-field__checkbox-label"
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={props.field.helpText}
            />
        </div>
    );
};

export default Checkbox;
