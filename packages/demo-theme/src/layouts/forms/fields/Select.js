// @flow
import * as React from "react";
import type { FieldType } from "webiny-app-forms/types";
import { I18NValue } from "webiny-app-i18n/components";

type Props = {
    bind: Object,
    field: FieldType
};

const Select = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--select">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-cms-form-field__select"
            >
                <option disabled value={""}>
                    {I18NValue({ value: props.field.placeholderText })}}
                </option>
                {props.field.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {I18NValue({ value: option.label })}
                    </option>
                ))}
            </select>
            <div className="webiny-cms-form-field__helper-text">
                <I18NValue value={props.field.helpText} />
            </div>
        </div>
    );
};

export default Select;
