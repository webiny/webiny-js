// @flow
import * as React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { reCaptchaEnabled } from "./../functions";
import type { FormDataType } from "webiny-app-forms/types";
import type { I18NStringValueType } from "webiny-app-i18n/types";

type Args = {
    formData: FormDataType,
    setResponseToken: (value: string) => void
};

type ChildrenFunction = ({ errorMessage: ?I18NStringValueType }) => React.Node;

export type ReCaptchaProps = {
    children?: React.Node | ChildrenFunction,
    onChange?: (value: string) => void,
    onErrored?: Function,
    onExpired?: Function
};

export type ReCaptchaComponentType = ReCaptchaProps => ?React.Node;

const createReCaptchaComponent = ({ formData, setResponseToken }: Args): ReCaptchaComponentType =>
    function ReCaptcha(props: ReCaptchaProps) {
        if (!reCaptchaEnabled(formData)) {
            return null;
        }

        const { settings } = formData;
        if (typeof props.children === "function") {
            return props.children({
                errorMessage: settings.reCaptcha.errorMessage
            });
        }

        if (props.children) {
            return props.children;
        }

        return (
            <ReCAPTCHA
                {...props}
                sitekey={settings.reCaptcha.settings.siteKey}
                onChange={response => {
                    setResponseToken(response);
                    typeof props.onChange === "function" && props.onChange(response);
                }}
                onErrored={(...args) => {
                    setResponseToken("");
                    typeof props.onErrored === "function" && props.onErrored(...args);
                }}
                onExpired={(...args) => {
                    setResponseToken("");
                    typeof props.onExpired === "function" && props.onExpired(...args);
                }}
            />
        );
    };

export default createReCaptchaComponent;
