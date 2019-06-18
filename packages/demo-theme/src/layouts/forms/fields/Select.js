// @flow
import * as React from "react";

type Props = {
    bind: Object,
    field: {
        fieldId: string,
        id: string,
        type?: string,
        options: Array<Object>,
        helpText?: string,
        defaultValue?: string,
        label?: string,
    }
};

const Select = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--select">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-cms-form-field__select"
            >
                <option disabled value={""}> -- select an option -- </option>
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
