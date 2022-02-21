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

interface Props {
    title: string;
}
export const PermissionInfo: React.FC<Props> = ({ title }) => (
    <div className={flexClass}>
        <Typography use={"subtitle2"}>{title}</Typography>
    </div>
);
