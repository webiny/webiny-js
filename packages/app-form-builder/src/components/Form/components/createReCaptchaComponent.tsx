import * as React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { reCaptchaEnabled } from "./../functions";
import { FbFormModel, FbFormRenderComponentProps } from "@webiny/app-form-builder/types";
import { I18NStringValue } from "@webiny/app-i18n/types";

type CreateReCaptchaComponentArgs = {
    props: FbFormRenderComponentProps;
    formData: FbFormModel;
    setResponseToken: (value: string) => void;
};

type ChildrenFunction = ({ errorMessage: I18NStringValue }) => React.ReactNode;

export type ReCaptchaProps = {
    children?: React.ReactNode | ChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: Function;
    onExpired?: Function;
};

export type ReCaptchaComponent = React.FC<ReCaptchaProps>;

const createReCaptchaComponent = ({
    formData,
    setResponseToken
}: CreateReCaptchaComponentArgs): ReCaptchaComponent =>
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
