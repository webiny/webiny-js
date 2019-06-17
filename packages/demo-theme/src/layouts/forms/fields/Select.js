// @flow
import * as React from "react";

type Props = {
    field: {
        fieldId: String,
        id: String,
        type?: String,
        options: Array,
        helpText?: String,
        defaultValue?: String,
        label?: String,
        placeholderText: String
    }
};

const Select = (props: Props) => {
    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--select">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <select
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-cms-form-field__select"
            >
                {props.field.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="webiny-cms-form-field__helper-text">{props.field.helpText}</div>
        </div>
    );
};

export default Select;
