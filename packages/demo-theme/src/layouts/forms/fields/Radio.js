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

const Radio = (props: Props) => {
    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--radio">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <div className="webiny-cms-form-field__radio-group">
                {props.field.options.map(option => (
                    <div className="webiny-cms-form-field__radio" key={option.value}>
                        <input
                            name={props.field.fieldId}
                            className="webiny-cms-form-field__radio-input"
                            type="radio"
                            id={"radio-" + props.field.fieldId + option.value}
                            value={option.value}
                        />
                        <label
                            htmlFor={"radio-" + props.field.fieldId + option.value}
                            className="webiny-cms-form-field__radio-label"
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

export default Radio;
