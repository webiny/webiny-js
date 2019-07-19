// @flow
import * as React from "react";
import type { FieldType } from "webiny-app-forms/types";
import { I18NValue } from "webiny-app-i18n/components";

type Props = {
    bind: Object,
    field: FieldType
};

const Radio = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--radio">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <div className="webiny-cms-form-field__radio-group">
                {props.field.options.map(option => {
                    console.log("ovo je moj,", option.label);
                    return (
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
                                {I18NValue({ value: option.label })}
                            </label>
                        </div>
                    );
                })}
            </div>
            <div className="webiny-cms-form-field__helper-text">
                <I18NValue value={props.field.helpText} />
            </div>
        </div>
    );
};

export default Radio;
