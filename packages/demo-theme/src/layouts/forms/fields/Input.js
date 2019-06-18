// @flow
import * as React from "react";

type Props = {
    type?: string,
    bind: Object,
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
    const { onChange, value } = props.bind;
    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--input">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <input
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={props.field.placeholderText}
                type={props.type}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__input"
            />
            <div className="webiny-cms-form-field__helper-text">{props.field.helpText}</div>
        </div>
    );
};

export default Input;
