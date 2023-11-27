import React from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { CreateFormParams, FormData } from "../../types";
import { termsOfServiceEnabled } from "~/renderers/form/FormRender/functions";

interface CreateTermsOfServiceComponentArgs {
    createFormParams: CreateFormParams;
    formData: FormData;
    setTermsOfServiceAccepted: (value: boolean) => void;
}

type ChildrenFunction = (params: {
    onChange: (value: boolean) => void;
    errorMessage: String;
    message: OutputBlockData[];
}) => React.ReactNode;

export interface TermsOfServiceProps {
    children: ChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: Function;
    onExpired?: Function;
}

export type TermsOfServiceComponent = React.FC<TermsOfServiceProps>;

const createTermsOfServiceComponent = ({
    formData,
    setTermsOfServiceAccepted
}: CreateTermsOfServiceComponentArgs): TermsOfServiceComponent =>
    // TODO @ts-refactor figure out how to type this
    // @ts-expect-error
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
