import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";

export const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const gridNoPaddingClass = css({
    padding: "0px !important"
});

export const PermissionInfo = ({ title }) => (
    <div className={flexClass}>
        <Typography use={"subtitle2"}>{title}</Typography>
    </div>
);
