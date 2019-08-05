// @flow
import * as React from "react";
import { I18NValue } from "webiny-app-i18n/components";
import HelperMessage from "../components/HelperMessage";
import type { FieldType } from "webiny-app-forms/types";
import type { BindComponentRenderPropType } from "webiny-form";

type Props = {
    type?: string,
    bind: BindComponentRenderPropType,
    field: FieldType
};

const Input = (props: Props) => {
    const { onChange, value, validation, validate } = props.bind;

    const onBlur = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            e.persist();
            validate();
        }
    };

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--input">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
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
                className="webiny-cms-form-field__input"
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
