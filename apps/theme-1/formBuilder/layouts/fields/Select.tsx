import * as React from "react";
import { FbFormModelField } from "@webiny/app-form-builder/types";
import { BindComponentRenderProp } from "@webiny/form";
import HelperMessage from "../components/HelperMessage";

type Props = {
    bind: BindComponentRenderProp;
    field: FbFormModelField;
};

const Select = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--select">
            <label className="webiny-fb-form-field__label webiny-pb-typography-body">
                {props.field.label}
            </label>
            <select
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className="webiny-fb-form-field__select"
            >
                <option disabled value={""}>
                    {props.field.placeholderText}
                </option>
                {props.field.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={props.field.helpText}
            />
        </div>
    );
};

export default Select;
