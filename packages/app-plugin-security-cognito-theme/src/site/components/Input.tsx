import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";

const HelperMessage = props => {
    return (
        <div
            className={
                "webiny-cognito-field__helper-text" +
                (props.isValid === false ? " webiny-cognito-field__helper-text--error" : "")
            }
        >
            {props.isValid === false ? props.errorMessage : props.helperMessage}
        </div>
    );
};

function Input(props) {
    const { onChange, value, validation, validate } = props;

    const onBlur = e => {
        if (validate) {
            e.persist();
            validate();
        }
    };

    return (
        <div className="webiny-cognito-field">
            <label className="webiny-cognito-field__label">
                <I18NValue value={props.label} />
            </label>
            <input
                onBlur={onBlur}
                onChange={e => onChange(e.target.value)}
                value={value || ""}
                placeholder={I18NValue(props.placeholderText)}
                type={props.type}
                className="webiny-cognito-field__input"
            />
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.helpText} />}
            />
        </div>
    );
}

export default Input;
