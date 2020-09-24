import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";

export const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const gridClass = css({
    padding: "0px !important"
});

export const PermissionInfo = ({ title }) => (
    <div className={flexClass}>
        <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
        <Typography use={"subtitle2"}>{title}</Typography>
    </div>
);
