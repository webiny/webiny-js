// @flow
import * as React from "react";
import { termsOfServiceEnabled } from "./../functions";
import  { FormDataType } from "@webiny/app-form-builder/types";
import  { I18NStringValue, I18NObjectValue } from "@webiny/app-i18n/types";

type Args = {
    formData: FormDataType,
    setTermsOfServiceAccepted: (value: boolean) => void
};

type ChildrenFunction = ({
    onChange: (value: boolean) => void,
    errorMessage: ?I18NStringValue,
    message: ?I18NObjectValue
}) => React.ReactNode;

export type TermsOfServiceProps = {
    children: ChildrenFunction,
    onChange?: (value: string) => void,
    onErrored?: Function,
    onExpired?: Function
};

export type TermsOfServiceComponentType = TermsOfServiceProps => ?React.ReactNode;

const createTermsOfServiceComponent = ({
    formData,
    setTermsOfServiceAccepted
}: Args): TermsOfServiceComponentType =>
    function TermsOfService(props: TermsOfServiceProps) {
        if (!termsOfServiceEnabled(formData)) {
            return null;
        }

        const { settings } = formData;
        if (typeof props.children === "function") {
            return props.children({
                errorMessage: settings.termsOfServiceMessage.errorMessage,
                message: settings.termsOfServiceMessage.message,
                onChange: setTermsOfServiceAccepted
            });
        }

        throw new Error("Please use a function for children prop of TermsOfService component.");
    };

export default createTermsOfServiceComponent;
