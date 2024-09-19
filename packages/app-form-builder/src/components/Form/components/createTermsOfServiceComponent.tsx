import React from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { termsOfServiceEnabled } from "./../functions";
import { FbFormModel, FbFormRenderComponentProps } from "~/types";

interface CreateTermsOfServiceComponentArgs {
    props: FbFormRenderComponentProps;
    formData: FbFormModel;
    setTermsOfServiceAccepted: (value: boolean) => void;
}

type ChildrenFunction = (params: {
    onChange: (value: boolean) => void;
    errorMessage: string;
    message: OutputBlockData[];
}) => React.ReactNode;

export interface TermsOfServiceProps {
    children: ChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: (...args: any) => void;
    onExpired?: (...args: any) => void;
}

export type TermsOfServiceComponent = React.ComponentType<TermsOfServiceProps>;

const createTermsOfServiceComponent = ({
    formData,
    setTermsOfServiceAccepted
}: CreateTermsOfServiceComponentArgs): TermsOfServiceComponent =>
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
