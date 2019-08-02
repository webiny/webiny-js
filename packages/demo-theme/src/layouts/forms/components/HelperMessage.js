// @flow
import * as React from "react";

type Props = {
    helperMessage?: React.Node,
    errorMessage: React.Node,
    isValid: boolean
};

const HelperMessage = (props: Props) => {
    return (
        <div
            className={
                "webiny-cms-form-field__helper-text" +
                (props.isValid === false ? " webiny-cms-form-field__helper-text--error" : "")
            }
        >
            {props.isValid === false ? props.errorMessage : props.helperMessage}
        </div>
    );
};

export default HelperMessage;
