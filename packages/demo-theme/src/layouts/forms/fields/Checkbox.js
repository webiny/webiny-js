// @flow
// $FlowFixMe
import React from "react";
import type { FieldType } from "webiny-app-forms/types";
import { I18NValue } from "webiny-app-i18n/components";
import HelperMessage from "../components/HelperMessage";

type Props = {
    bind: Object,
    field: FieldType
};

const change = ({ option, value, onChange }) => {
    const newValues = Array.isArray(value) ? [...value] : [];
    if (newValues.includes(option.value)) {
        newValues.splice(newValues.indexOf(option.value), 1);
    } else {
        newValues.push(option.value);
    }

    onChange(newValues);
};

const checked = ({ option, value }) => {
    return Array.isArray(value) && value.includes(option.value);
};

const Checkbox = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--checkbox">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <div className="webiny-cms-form-field__checkbox-group">
                {props.field.options.map(option => (
                    <div className="webiny-cms-form-field__checkbox" key={option.value}>
                        <input
                            name={props.field.fieldId}
                            className="webiny-cms-form-field__checkbox-input"
                            type="checkbox"
                            id={"checkbox-" + props.field.fieldId + option.value}
                            checked={checked({ option, value })}
                            onChange={() => change({ option, value, onChange })}
                        />
                        <label
                            htmlFor={"checkbox-" + props.field.fieldId + option.value}
                            className="webiny-cms-form-field__checkbox-label"
                        >
                            <I18NValue value={option.label} />
                        </label>
                    </div>
                ))}
            </div>
            <HelperMessage
                isValid={props.validation.isValid}
                errorMessage={props.validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Checkbox;
