// @flow
// $FlowFixMe
import React from "react";
import { useI18N } from "webiny-app-i18n/components";
import type { FieldType } from "webiny-app-forms/types";

type Props = {
    bind: Object,
    field: FieldType
};

const Checkbox = (props: Props) => {
    const { onChange, value } = props.bind;
    const { translate } = useI18N();

    const change = option => {
        const newValues = Array.isArray(value) ? [...value] : [];
        if (newValues.includes(option.value)) {
            newValues.splice(newValues.indexOf(option.value), 1);
        } else {
            newValues.push(option.value);
        }

        onChange(newValues);
    };

    const checked = option => {
        return Array.isArray(value) && value.includes(option.value);
    };

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--checkbox">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {translate(props.field.label)}
            </label>
            <div className="webiny-cms-form-field__checkbox-group">
                {props.field.settings.options.map(option => (
                    <div className="webiny-cms-form-field__checkbox" key={option.value}>
                        <input
                            name={props.field.fieldId}
                            className="webiny-cms-form-field__checkbox-input"
                            type="checkbox"
                            id={"checkbox-" + props.field.fieldId + option.value}
                            checked={checked(option)}
                            onChange={() => change(option)}
                        />
                        <label
                            htmlFor={"checkbox-" + props.field.fieldId + option.value}
                            className="webiny-cms-form-field__checkbox-label"
                        >
                            {translate(option.label)}
                        </label>
                    </div>
                ))}
            </div>
            <div className="webiny-cms-form-field__helper-text">
                {translate(props.field.helpText)}
            </div>
        </div>
    );
};

export default Checkbox;
