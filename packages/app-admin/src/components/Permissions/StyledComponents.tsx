import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";

export const flexClass = css({
    display: "flex",
    alignItems: "center",
    height: "100%"
});

export const gridNoPaddingClass = css({
    padding: "0px !important"
});

interface PermissionInfoProps {
    title: string;
}
export const PermissionInfo = ({ title }: PermissionInfoProps) => (
    <div className={flexClass}>
        <Typography use={"body2"}>{title}</Typography>
    </div>
);
