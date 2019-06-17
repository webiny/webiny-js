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

const Checkbox = (props: Props) => {
    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--checkbox">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <div className="webiny-cms-form-field__checkbox-group">
                {props.field.options.map(option => (
                    <div className="webiny-cms-form-field__checkbox" key={option.value}>
                        <input
                            name={props.field.fieldId}
                            className="webiny-cms-form-field__checkbox-input"
                            type="checkbox"
                            id={"checkbox-" + props.field.fieldId + option.value}
                            value={option.value}
                        />
                        <label
                            htmlFor={"checkbox-" + props.field.fieldId + option.value}
                            className="webiny-cms-form-field__checkbox-label"
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
            <div className="webiny-cms-form-field__helper-text">{props.field.helpText}</div>
        </div>
    );
};

export default Checkbox;
