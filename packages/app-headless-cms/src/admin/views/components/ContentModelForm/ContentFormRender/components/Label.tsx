import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";

const style = {
    label: css({
        marginBottom: "5px !important"
    })
};

const Label = ({ children }) => (
    <div
        className={classNames(
            "mdc-text-field-helper-text mdc-text-field-helper-text--persistent",
            style.label
        )}
    >
        <Typography use={"subtitle2"}>{children}</Typography>
    </div>
);

export default Label;
