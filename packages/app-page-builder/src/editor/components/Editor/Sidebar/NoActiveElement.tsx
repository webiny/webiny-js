import React, { ReactElement } from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";

const noActiveElementWrapper = css({
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    margin: "48px 16px",
    backgroundColor: "var(--mdc-theme-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    maxHeight: 150,
    "& .icon": {
        fill: "var(--mdc-theme-text-icon-on-background)",
        width: 36,
        height: 36
    },
    "& .text": {
        marginTop: 16,
        color: "var(--mdc-theme-text-on-background)",
        textAlign: "center"
    }
});

interface NoActiveElementProps {
    message: string;
    icon?: ReactElement;
}

const NoActiveElement = ({ message, icon }: NoActiveElementProps) => {
    return (
        <div className={noActiveElementWrapper}>
            {icon && React.cloneElement(icon, { className: "icon" })}
            <Typography use={"subtitle1"} className={"text"}>
                {message}
            </Typography>
        </div>
    );
};

export default React.memo(NoActiveElement);
