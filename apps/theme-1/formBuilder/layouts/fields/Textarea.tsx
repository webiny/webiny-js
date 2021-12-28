import * as React from "react";
import { FbFormModelField } from "@webiny/app-form-builder/types";
import { BindComponentRenderProp } from "@webiny/form";
import HelperMessage from "../components/HelperMessage";

type Props = {
    bind: BindComponentRenderProp;
    field: FbFormModelField;
};

const Textarea = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--textarea">
            <label className="webiny-fb-form-field__label webiny-pb-typography-body">
                {props.field.label}
            </label>
            <textarea
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={props.field.placeholderText}
                rows={props.field.settings.rows ? props.field.settings.rows : 4}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-fb-form-field__textarea"
            />
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={props.field.helpText}
            />
        </div>
    );
};

export default Textarea;
