import * as React from "react";
declare type AlertProps = {
    title: string;
    type: "success" | "info" | "warning" | "danger";
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};
/**
 * Use Alert component to display user's avatar.
 */
declare const Alert: (props: AlertProps) => JSX.Element;
export { Alert };
