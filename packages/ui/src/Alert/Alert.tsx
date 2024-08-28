import React from "react";
import { Alert as AlertBase, AlertProps as AlertPropsBase } from "@webiny/admin-ui/Alert";

export type AlertType = "success" | "info" | "warning" | "danger" | string;

export interface AlertProps extends AlertPropsBase {
    /**
     * @deprecated Will be removed in the future release.
     */
    children?: React.ReactNode;

    // Alert type.
    type: AlertType;
}

/**
 * Use Alert component to display user's avatar.
 */
const Alert = (props: AlertProps) => {
    const { type, text, children } = props;
    return <AlertBase {...props} variant={type} text={text || children} />;
};

export { Alert };
