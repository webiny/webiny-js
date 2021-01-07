import * as React from "react";
import { FbFormModelField } from "@webiny/app-form-builder/types";
import { BindComponentRenderProp } from "@webiny/form";
import HelperMessage from "../components/HelperMessage";

type Props = {
    bind: BindComponentRenderProp;
    field: FbFormModelField;
};

const Radio = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    const fieldId = props.field.fieldId;

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--radio">
            <label className="webiny-fb-form-field__label webiny-pb-typography-body">
                {props.field.label}
            </label>
            <div className="webiny-fb-form-field__radio-group">
                {props.field.options.map(option => {
                    return (
                        <div className="webiny-fb-form-field__radio" key={option.value}>
                            <input
                                checked={value === option.value}
                                onChange={() => onChange(option.value)}
                                name={fieldId}
                                className="webiny-fb-form-field__radio-input"
                                type="radio"
                                id={"radio-" + fieldId + option.value}
                                value={option.value}
                            />
                            <label
                                htmlFor={"radio-" + fieldId + option.value}
                                className="webiny-fb-form-field__radio-label"
                            >
                                {option.label}
                            </label>
                        </div>
                    );
                })}
            </div>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={props.field.helpText}
            />
        </div>
    );
};

export default Radio;
