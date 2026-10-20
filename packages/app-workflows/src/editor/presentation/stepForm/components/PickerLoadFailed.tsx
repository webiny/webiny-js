import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";

export interface PickerLoadFailedProps {
    label: string;
    required?: boolean;
    disabled: boolean;
    onRetry(): void;
}

// A list a picker needs could not be loaded (R281): the label, the options banner and `Try again`.
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
        </div>
    );
};
