import * as React from "react";
import { css } from "emotion";

const alertStyles = css({
    borderLeft: "3px solid red",
    margin: "5px 0 15px 0",
    padding: "2px 0 2px 10px",
    ".webiny-ui-alert__title": {
        fontWeight: 600,
        lineHeight: "150%",
        color: "var(--mdc-theme-on-surface)",
        marginBottom: 5
    },
    ".webiny-ui-alert__message": {
        lineHeight: "100%",
        fontSize: 14,
        color: "var(--mdc-theme-on-surface)"
    },
    "&.webiny-ui-alert--success": {
        borderColor: "#21CEAF"
    },
    "&.webiny-ui-alert--info": {
        borderColor: "#29A9DB"
    },
    "&.webiny-ui-alert--warning": {
        borderColor: "#F45C3C"
    },
    "&.webiny-ui-alert--danger": {
        borderColor: "#E4495C"
    }
});

export type AlertType = "success" | "info" | "warning" | "danger";

type AlertProps = {
    // Alert title.
    title: string;

    // Alert type.
    type: AlertType;

    // Alert message.
    children?: React.ReactNode;

    // CSS class name
    className?: string;

    // Style object
    style?: React.CSSProperties;
};

/**
 * Use Alert component to display user's avatar.
 */
const Alert = (props: AlertProps) => {
    const { title, type, children, ...rest } = props;

    return (
        <div {...rest} className={alertStyles + " webiny-ui-alert webiny-ui-alert--" + type}>
            <p className={"webiny-ui-alert__title"}>{title}</p>
            <p className={"webiny-ui-alert__message"}>{children}</p>
        </div>
    );
};

export { Alert };
