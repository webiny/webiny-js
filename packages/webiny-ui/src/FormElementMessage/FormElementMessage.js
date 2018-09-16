//@flow
import * as React from "react";
import classnames from "classnames";

type Props = {
    // message to display
    children: React.Node,

    // optional class name
    className?: string,

    // is it an error message we're displaying
    error?: boolean
};

const FormElementMessage = (props: Props) => {
    let classNames = classnames(
        "mdc-text-field-helper-text mdc-text-field-helper-text--persistent",
        props.className,
        { "mdc-text-field-helper-text--error": props.error }
    );

    return <div className={classNames}>{props.children}</div>;
};

export { FormElementMessage };
