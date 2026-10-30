import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";

export interface PickerLoadFailedProps {
    label: string;
    required?: boolean;
    disabled: boolean;
    /** The field's validation message, so a refused value stays explained while the list fails. */
    error: string | null;
    onRetry(): void;
}

// A list a picker needs could not be loaded (R281): the label, the options banner, `Try again`
// and the field's error.
export const PickerLoadFailed = (props: PickerLoadFailedProps) => {
    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={props.label}
                required={props.required}
                disabled={props.disabled}
            />
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={
                    <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={props.onRetry} />
                }
            >
                {STEP_FORM_MESSAGES.optionsFailed}
            </Alert>
            {props.error !== null && (
                <FormComponentErrorMessage text={props.error} invalid disabled={props.disabled} />
            )}
        </div>
    );
};
