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
        placeholderText: string
    }
};

const Radio = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--radio">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <div className="webiny-cms-form-field__radio-group">
                {props.field.options.map(option => (
                    <div className="webiny-cms-form-field__radio" key={option.value}>
                        <input
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
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
