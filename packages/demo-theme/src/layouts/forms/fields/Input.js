// @flow
import * as React from "react";

type Props = {
    field: {
        fieldId: String,
        id: String,
        type: String,
        helpText?: String,
        defaultValue?: String,
        label?: String,
        placeholderText: String,
        rows?: String
    }
};

const Input = (props: Props) => {
    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--input">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <input
                type="text"
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__input"
            />
            <div className="webiny-cms-form-field__helper-text">{props.field.helpText}</div>
        </div>
    );
};

export default Input;
