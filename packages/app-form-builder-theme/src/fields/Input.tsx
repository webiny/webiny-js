import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import HelperMessage from "../components/HelperMessage";
import { FbFormModelField } from "@webiny/app-form-builder/types";
import { BindComponentRenderProp } from "@webiny/form";

type Props = {
    type?: string;
    bind: BindComponentRenderProp;
    field: FbFormModelField;
};

const Input = (props: Props) => {
    const { onChange, value, validation, validate } = props.bind;

    // @ts-ignore
    const onBlur = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            e.persist();
            validate();
        }
    };

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--input">
            <label className="webiny-pb-typography-body webiny-fb-form-field__label">
                <I18NValue value={props.field.label} />
            </label>
            <input
                onBlur={onBlur}
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={I18NValue(props.field.placeholderText)}
                type={props.type}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-fb-form-field__input"
            />
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Input;
