// @flow
import * as React from "react";
import type { FieldType } from "webiny-app-forms/types";
import { I18NValue } from "webiny-app-i18n/components";
import HelperMessage from "../components/HelperMessage";
import type { BindComponentRenderPropType } from "webiny-form";

type Props = {
    bind: BindComponentRenderPropType,
    field: FieldType
};

const Select = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    return (
        <div className="webiny-pb-form-field webiny-pb-form-field--select">
            <label className="webiny-pb-form-field__label webiny-pb-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-pb-form-field__select"
            >
                <option disabled value={""}>
                    {I18NValue({ value: props.field.placeholderText })}
                </option>
                {props.field.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {I18NValue({ value: option.label })}
                    </option>
                ))}
            </select>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Select;
