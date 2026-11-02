import React from "react";
import { Alert } from "@webiny/admin-ui";
import { STEP_FORM_MESSAGES } from "../../stepFormMessages.js";

export interface TestRoutingFailureProps {
    // The full text, `Could not test routing: ...` (R300).
    message: string;
    canRun: boolean;
    onRetry(): void;
}

export const TestRoutingFailure = (props: TestRoutingFailureProps) => {
    return (
        <Alert
            type={"danger"}
            variant={"subtle"}
            actions={
                <Alert.Action
                    text={STEP_FORM_MESSAGES.tryAgain}
                    disabled={!props.canRun}
                    onClick={props.onRetry}
                />
            }
        >
            {props.message}
        </Alert>
    );
};
