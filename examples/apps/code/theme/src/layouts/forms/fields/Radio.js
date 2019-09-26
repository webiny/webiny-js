// @flow
import * as React from "react";
import type { FieldType } from "@webiny/app-forms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import HelperMessage from "../components/HelperMessage";
import type { BindComponentRenderPropType } from "@webiny/form";

type Props = {
    bind: BindComponentRenderPropType,
    field: FieldType
};

const Radio = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    const fieldId: string = (props.field.fieldId: any);

    return (
        <div className="webiny-pb-form-field webiny-pb-form-field--radio">
            <label className="webiny-pb-form-field__label webiny-pb-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <div className="webiny-pb-form-field__radio-group">
                {props.field.options.map(option => {
                    return (
                        <div className="webiny-pb-form-field__radio" key={option.value}>
                            <input
                                checked={value === option.value}
                                onChange={() => onChange(option.value)}
                                name={fieldId}
                                className="webiny-pb-form-field__radio-input"
                                type="radio"
                                id={"radio-" + fieldId + option.value}
                                value={option.value}
                            />
                            <label
                                htmlFor={"radio-" + fieldId + option.value}
                                className="webiny-pb-form-field__radio-label"
                            >
                                {I18NValue({ value: option.label })}
                            </label>
                        </div>
                    );
                })}
            </div>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Radio;
