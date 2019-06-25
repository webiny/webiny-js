// @flow
import * as React from "react";
import { useI18N } from "webiny-app-forms/__i18n/components";
import type { FieldType } from "webiny-app-forms/types";

type Props = {
    bind: Object,
    field: FieldType
};

const Select = (props: Props) => {
    const { onChange, value } = props.bind;
    const { translate } = useI18N();

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--select">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {translate(props.field.label)}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-cms-form-field__select"
            >
                <option disabled value={""}>
                    {translate(props.field.placeholderText)}
                </option>
                {props.field.settings.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {translate(option.label)}
                    </option>
                ))}
            </select>
            <div className="webiny-cms-form-field__helper-text">
                {translate(props.field.helpText)}
            </div>
        </div>
    );
};

export default Select;
