// @flow
import * as React from "react";

type Props = {
    helperMessage?: React.Node,
    errorMessage: React.Node,
    isValid: boolean
};

/**
 * A component that is used to show helper (description) and validation error messages.
 */
const HelperMessage = (props: Props) => {
    return (
        <div
            className={
                "webiny-pb-form-field__helper-text" +
                (props.isValid === false ? " webiny-pb-form-field__helper-text--error" : "")
            }
        >
            {props.isValid === false ? props.errorMessage : props.helperMessage}
        </div>
    );
};

export default HelperMessage;
