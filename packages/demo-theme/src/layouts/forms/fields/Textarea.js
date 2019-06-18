// @flow
import * as React from "react";

type Props = {
    bind: Object,
    field: {
        fieldId: string,
        id: string,
        type: string,
        helpText?: string,
        defaultValue?: string,
        label?: string,
        placeholderText: string,
        rows?: string
    }
};

const Textarea = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--textarea">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {props.field.label}
            </label>
            <textarea
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={props.field.placeholderText}
                rows={props.field.rows ? props.field.rows : 4}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__textarea"
            />
            <div className="webiny-cms-form-field__helper-text">{props.field.helpText}</div>
        </div>
    );
};

export default Textarea;
