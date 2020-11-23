import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as HelpIcon } from "@webiny/app-admin/assets/icons/round-help-24px.svg";

export const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const gridNoPaddingClass = css({
    padding: "0px !important"
});

export const PermissionInfo = ({ title }) => (
    <div className={flexClass}>
        <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
        <Typography use={"subtitle2"}>{title}</Typography>
    </div>
);
